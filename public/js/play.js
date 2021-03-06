$(function(){

const ID = $("#participant-id").text();
const COMMAND = {
    AUTH: "cmd auth",
    AUTH_FAILED: "cmd auth failed",
	PAUSE: "cmd pause",
	RESUME: "cmd resume"
}
const EVENT = {
    COMPLETE: 'complete',
    DECISION: 'decision',
    END_PERIOD: 'end period',
    LEAVE_ROOM: 'leave room',
    NEW_GAME: 'new game',
    NEW_PERIOD: 'new period',
    OP_LOST: 'opponent lost',
    PROPOSE: 'propose',
    READY: 'ready',
    RESULT: 'result',
    TEST: 'test',
    WAIT: 'wait opponent',
}
const INFO = {
	ACCEPTED: "Proposal Accpeted!",
	NONE: "No Agreement!",
	REJECTED: "Proposal Rejected!",
	LEAVE: "Deal with External Buyer!",
	WAIT: 'Waiting for proposal...'
}
const CLASS = {
	ACCEPTED: 'accepted',
	DISABLE: 'disable',
	DONE: 'done',
	GREEN: 'green',
	HIGHLIGHT: 'highlight',
	NONE: 'rejected',
	PROPOSAL: 'proposal',
	RED: 'red',
	REJECTED: 'rejected',
	LEAVE: 'leave',
	WAIT: 'wait',
}

// whether the player is in a period
var gPlaying = false;

// whether the player is waiting for opponent
var gWaitingOpponent;

// whether paused
var gPaused;

// whether the opponent is lost when paused
var gOpponentLost = false;

var $accept = $("button#accept")
  , $backdrops = $(".backdrop")
  , $boxes = $(".box")
  , $continue = $("#continue")
  , $description = $("#description")
  , $input = $(".input-box input")
  , $game = $("#game")
  , $gamesLeft = $("#games-left")
  , $labelExternal = $("#external-buyers-label")
  , $labelHighest = $("#highest-price-label")
  , $labelNumber = $("p.number")
  , $leave = $("button#leave")
  , $loader = $(".loader")
  , $operation = $(".operation")
  , $operationButtons = $(".button-box button")
  , $preparation = $("#preparation")
  , $preparationTime = $(".preparation-time")
  , $progressRow = $("#progress-row")
  , $progressLabel = $("#progress-label")
  , $proposal = $(".proposal")
  , $propose = $("button#propose")
  , $quit = $("#quit")
  , $ready = $(".ready")
  , $reconnect = $(".reconnect")
  , $reject = $("button#reject")
  , $result = $("#result")
  , $role = $(".role")
  , $tables = $("table.price")
  , $table5 = $("table#table5")
  , $table10 = $("table#table10")
  , $table15 = $("table#table15")
  , $timeBar = $("td .time-bar")
  , $timeClock = $(".clock")
  , $timer = $(".timer")
  , $viewDescription = $("#view-description")
  , $waiting = $("#waiting")
  , $waitingInfo = $("#waiting-info")
  ,	$warmup = $("#warm-up")
  ;

var DEFAULT_PARAMS; 

const socket = io.connect();
socket.on(COMMAND.AUTH, (defaultParams, respond) => {
	DEFAULT_PARAMS = DEFAULT_PARAMS || defaultParams;
	var info = {
		id: ID,
		waiting: gWaitingOpponent,
		inGame: (gPlaying || preparation.preparing),
		game: dealer.game,
		period: dealer.period
	}
	console.log(info);
	respond(info);
});

const ensureConnection = () => {
	if (!socket.connected) {
		console.log("Try reconnecting...")
		socket.connect();
	}
}

// timer for proposal and decision
const timer = new function() {

	const time = 60;
	var count = time;
	var started = false;

	this.start = function () {
		if (started || gPaused) {
			return;
		}

		started = true;
		$timeBar.animate({width: '0%'}, count * 1000);

		this.interval = setInterval(() => {
			if (count % 20 == 0) {
				socket.emit(EVENT.TEST);
			}
			count--;
			$timeClock.html(('0' + count).slice(-2)); 
			if (count == 10) {
				$timer.addClass(CLASS.RED);
			}
			if ($proposal.hasClass(CLASS.WAIT)) {
				$proposal.animate({
					backgroundColor: count % 2 ? '#fafafa' : '#eee'
				}, 1000);
			}
			if (count == 0) {
				this.stop();
				ensureConnection();
				dealer.endPeriod();
			}
		}, 1000);
	}

	this.stop = function () {
		started = false;
		$timeBar.stop();
		clearInterval(this.interval);
	}

	this.reset = function () {
		this.stop();
		count = time;
		$timeClock.html(time);
		$timer.removeClass(CLASS.RED);
		$timeBar.css('width', '100%');
	}

	this.lap = function () {
		return time - count;
	}
}

// timer for preparation
const preparation = new function() {

	const time = 10;
	var count = time;
	var started = false;

	this.preparing = false;

	this.start = function () {
		if (started || gPaused) {
			return;
		}

		started = true;
		this.preparing = true;
		gWaitingOpponent = false;

		$boxes.hide();
		$game.show();
		$preparationTime.html(count);
		$preparation.fadeIn(1000);

		this.interval = setInterval(() => {
			count--;
			if (count > 0) {
				$preparationTime.html(count);
			} else if (count == 0) {
				$preparationTime.html("Start!");
				$preparation.fadeOut(1000);
			} else {
				this.reset();
				dealer.initPeriod();
			}
		}, 1000);
	}

	this.stop = function () {
		clearInterval(this.interval);
		started = false;
	}

	this.reset = function () {
		this.stop();
		count = time;
		this.preparing = false;
	}

}

const dealer = new function() {

	this.game = {}
	this.period = {};

	const isMyTurn = () => {
		if (this.period.proposer_id == ID && this.period.price == null) {
			return true;
		}
		if (this.period.proposer_id != ID && this.period.price != null) {
			return true;
		}
		return false;
	}

	const enableButton = ($button, listener) => {
		$button.show();
		$button.removeClass(CLASS.DISABLE);
		$button.click(listener);
	}

	const disableButton = ($buttons) => {
		$buttons.addClass(CLASS.DISABLE);
		$buttons.off("click");
	}

	// show proposal information
	const showProposal = (info) => {
		$input.hide();
		$proposal.attr('class', CLASS.PROPOSAL);
		if (CLASS[info]) {	
			$proposal.addClass(CLASS[info]);
			$proposal.html(INFO[info]);
		} else {
			$proposal.html(info);
		}
		$operation.show();
		$proposal.show();
	}

	this.setExternalBuyers = (period) => {
		if (!period) {
			$labelExternal.html('0');
			$labelHighest.html('$0.00');
		} else {
			$labelExternal.html(period.external_buyers);
			$labelHighest.html('$' + period.highest_price.toFixed(2))
			if (period.show_up_external_buyer) {
				$labelNumber.animate({
					color: '#f80',
				}, 500).animate({
					color: '#888'
				}, 500);
			}
		}
	}

	this.syncPeriod = (period) => {
		this.period = period;
	}

	this.initPeriod = () => {

		gPlaying = true;

		var $grids = $progressRow.find('div');
		$grids.eq(this.period.number - 1).addClass(CLASS.DONE);
		var $gridsDone = $progressRow.find('div.done');
		if ($grids.length - $gridsDone.length < 2) {
			$gridsDone.css('backgroundColor', '#f55');
		} else if ($gridsDone.length / $grids.length > 0.5) {
			$gridsDone.css('backgroundColor', '#fa0');
		}

		var t = $progressLabel.html().split('/')[1];
		$progressLabel.html(this.period.number + "/" + t);

		$backdrops.hide();
		$operation.show();
		$input.hide();
		$proposal.hide();
		$operationButtons.hide();
		$timer.show();

		timer.reset();

		this.setExternalBuyers(this.period);

		if ($role.html() == 'seller') {
			enableButton($leave, btnListenr.leave);
		}

		if (this.period.proposer_id == ID) {
			$input.val('').show();
			enableButton($propose, btnListenr.propose);
		} else {
			showProposal('WAIT');
			$accept.show();
			$reject.show();
			disableButton($operationButtons);
		}
		timer.start();
	}

	this.propose = (price) => {
		this.period.price = price;
		this.period.proposed_at = timer.lap();
		socket.emit(EVENT.PROPOSE, this.period);
	}

	this.onProposal = (period) => {
		this.period = period;
		if (isMyTurn()) {
			showProposal("$" + this.period.price);
			enableButton($accept, btnListenr.accept);
			enableButton($reject, btnListenr.reject);
			$proposal.stop();
			$proposal.css('backgroundColor', '#eee');
		} else {
			disableButton($propose);
			showProposal("Your proposal: $" + this.period.price);
		}
		timer.reset();
		timer.start();
	}

	this.decide = (accepted) => {
		this.period.accepted = accepted;
		this.period.decided_at = timer.lap();
		this.endPeriod();
	}

	this.leave = () => {
		this.period.leave = true;
		this.period.decided_at = timer.lap();
		this.endPeriod();
	}

	this.onDecision = (period) => {
		this.period = period;
		timer.stop();
		disableButton($operationButtons);
		disableButton($leave);
		if (this.period.leave) {
			showProposal('LEAVE');
		} else if (this.period.accepted) {
			showProposal('ACCEPTED');
		} else if (this.period.decided_at) {
			showProposal('REJECTED');
		} else {
			showProposal('NONE');
		}
		this.period = {};
	}

	this.ending = false;
	this.endPeriod = () => {
		if (this.ending) {
			return;
		} else if (!isMyTurn() && $role.html() != 'seller') {
			return;
		}
		this.ending = true;

		ensureConnection();

		var keepSending;
		const sendEndPeriod = () => {
			socket.emit(EVENT.END_PERIOD, this.period, (ack) => {
				console.log("end period: " + ack);
				if (ack) {
					clearInterval(keepSending);
					this.ending = false;
				}
			});
		}
		sendEndPeriod()
		keepSending = setInterval(sendEndPeriod, 3000);
	}

}

const waiting = (info) => {
	info = gPaused ? "Paused" : info || "Looking for your opponent...";
	$waitingInfo.html(info)
	$waiting.show();
}

const getReady = () => {
	socket.emit(EVENT.READY);
}


socket.on(EVENT.COMPLETE, () => {
	location.href = "/play/complete";
});

socket.on(EVENT.DECISION, dealer.onDecision);

socket.on(EVENT.OP_LOST, (info) => {
	if (gPaused) {
		socket.emit(EVENT.LEAVE_ROOM);
		gOpponentLost = true;
	} else {
		socket.emit(EVENT.LEAVE_ROOM);
		setTimeout(() => {
			getReady();
		}, 5000);
		if (!gWaitingOpponent) {
			waiting(info);
			timer.stop();
			preparation.stop();
			setTimeout(() => {
				waiting("Looking for another opponent...")
			}, 2000);
		}
	}
});

socket.on(EVENT.NEW_GAME, (data) => {

	dealer.game = data.game;

	timer.reset();
	preparation.reset();

	$waiting.hide();

	$operation.hide();

	$gamesLeft.html(data.gamesLeft);
	$role.html(data.role);
	
	if (data.role == 'seller') {
		$leave.show()
	} else {
		$leave.hide()
	}

	const defaultParams = DEFAULT_PARAMS;
	const game = data.game;
	for (let i in defaultParams) {
		let $param = $("." + i);
		$param.html(game[i]);
		if (game[i] != defaultParams[i]) {
			$param.parent().addClass(CLASS.HIGHLIGHT);
		} else {
			$param.parent().removeClass(CLASS.HIGHLIGHT);
		}
	}

	$tables.hide()
	if (game.t == 10) {
		$table10.show()
	} else if (game.t == 5) {
		$table5.show()
	} else {
		$table15.show()
	}

	$progressLabel.html("0/" + game.t);
	$progressRow.children().slice(2).detach();
	for (let i = 0; i < game.t; i++) {
		$progressRow.append("<td><div></div></td>");
	}

	dealer.setExternalBuyers();
});

socket.on(EVENT.NEW_PERIOD, (period) => {
	dealer.syncPeriod(period);

	if (period.number == 1) {
		preparation.start();
	} else {
		setTimeout(() => {
			dealer.initPeriod();
		}, 1000);
	}

});

socket.on(EVENT.PROPOSE, dealer.onProposal);

socket.on(EVENT.RESULT, (result) => {
	dealer.game = {};
	gPlaying = false;
	socket.emit(EVENT.RESULT);
	for (let i in result) {
		let $cell = $("#" + i);
		$cell.removeClass();
		if (result[i] == null) {
			$cell.html("&#10007");
			$cell.addClass(CLASS.RED);
		} else if (result[i] < 0) {
			$cell.html("-$" + (-result[i].toFixed(2)));
		} else {
			$cell.html("$" + (+result[i].toFixed(2)));
		}
	}
	setTimeout(() => {
		$result.show();
	}, 1000);
});

socket.on(EVENT.TEST, (data) => {
	console.log(data);
});

socket.on(EVENT.WAIT, (data) => {
	$backdrops.hide();
	waiting(data);
});


socket.on(COMMAND.AUTH_FAILED, (info) => {
	$backdrops.hide();
	$("#auth-failed-info").html(info);
	$("#auth-failed").show();
	$(window).off("beforeunload");
});

socket.on(COMMAND.PAUSE, () => {
	gPaused = true;
	waiting("Paused");
	$loader.addClass("stop");
	timer.stop();
	preparation.stop();
	if (gWaitingOpponent) {
		socket.emit(EVENT.LEAVE_ROOM);	
	}
})

socket.on(COMMAND.RESUME, () => {
	gPaused = false;
	$waiting.hide();
	$loader.removeClass("stop");
	if (gOpponentLost) {
		$backdrops.hide();
		waiting("Your opponent is lost!");
		setTimeout(() => {
			waiting("Looking for another opponent...");
			getReady();
			gWaitingOpponent = true;
			gOpponentLost = false;
		}, 2000);
	} else if (gWaitingOpponent) {
		getReady();
		gOpponentLost = false;
	} else if (gPlaying) {
		timer.start();
	} else if (preparation.preparing) {
		preparation.start();
	}
})

socket.on("disconnect", () => {
	if (gWaitingOpponent && !gPaused) {
		gWaitingOpponent = false;
		$waiting.hide();
		if ($game.is(":visible")) {
			$result.show();
		}
		socket.emit(EVENT.LEAVE_ROOM);
	}
})

var btnListenr = {}

btnListenr.propose = () => {
	ensureConnection();
	var price = +parseFloat($input.val()).toFixed(2);
	if (isNaN(price) || price <= 0 || price > parseInt($('#reselling-price').html())) {
		$input.animate({
			color: '#f88',
		}, 300).animate({
			color: '#000'
		}, 300);
		return;
	}
	dealer.propose(price);	
}

btnListenr.accept = () => {
	ensureConnection();
	dealer.decide(true);
}

btnListenr.reject = () => {
	ensureConnection();
	dealer.decide(false);
}

btnListenr.leave = () => {
	ensureConnection();
	dealer.leave();
}

$ready.click((event) => {
	ensureConnection();

	if ($gamesLeft.html() == '0') {
		location.href = "/play/complete";
	} else if (!$(event.currentTarget).hasClass("warmed-up")) {
		getReady();
		gWaitingOpponent = true;
		gOpponentLost = false;
	} else {
		// finish the warm-up
		$("#game").hide();
		$("#welcome-page").show();
		$("#welcome").hide();
		$("#good-job").show();
	    $("#welcome-info").hide();
		$("#continue-info").hide();
		$("#good-job-info").show();
		$backdrops.hide();
		$warmup.hide();
		$description.hide();
		$viewDescription.show();
		$continue.show();

		$(event.currentTarget).removeClass("warmed-up");
	}
});

$viewDescription.click(() => {
	$description.slideToggle(500);
});

$input.keypress((event) => {
	var theEvent = event || window.event;
    var key = theEvent.keyCode || theEvent.which;
    if (key === 13 && !gPaused) {
    	$propose.click();
    } else {
    	key = String.fromCharCode(key);
	    var regex = /[0-9]|\./;
	    if(!regex.test(key)) {
	        theEvent.returnValue = false;
	        if (theEvent.preventDefault) {
	        	theEvent.preventDefault();
	        }
	    }
    }  
});

$quit.click(() => {
	location.href = "/logout";
});

$(window).bind('beforeunload', function() {
	if (gPlaying || gWaitingOpponent || preparation.preparing) {
		return 'Are you sure you want to leave?';
	}
});


// $boxes.hide()
// $game.show()

// // for test
// $reconnect.click(() => {
// 	socket.disconnect();
// 	console.log("Try reconnecting...")
// 	setTimeout(() => {
// 		socket.connect();
// 	}, 3000);
// });


});


