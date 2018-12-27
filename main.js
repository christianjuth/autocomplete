// ---------------
// Load Dictionary
// ---------------

let dictionary;

$.getJSON("./words.json", function(json) {
    dictionary = json;

    let sorted = {};

    dictionary.forEach((word) => {
    	sorted[word.length] = sorted[word.length] || [];
    	sorted[word.length].push(word);
    });

    dictionary = sorted;
});


Array.prototype.intersection = function(arr2, sameOrder = true) {
	let arr1 = this;

	if(sameOrder){
		return arr1.filter(value => arr2.indexOf(value) !== -1);
	} else{
		return arr1.filter((value, i) => arr2[i] === value);
	}
}

Array.prototype.removeDuplicates = function() {
	return this.filter((item, pos) => {
	    return this.indexOf(item) == pos;
	});
}

String.prototype.matchcase = function (string) {
    let str = string.split('');
    let value = this.split('');

    value.forEach((char, i) => {
    	if(/[A-Z]/.test(string[i] || 'a'))
    		value[i] = char.toUpperCase();
    	else
    		value[i] = char.toLowerCase();
    })

    return value.join('');
};



// ---------------
// Find Match
// ---------------

let compare = (word, reference) => {
	let letters = word.split('');

	let intersection = 0;

	letters.slice(0, reference.length).forEach((letter, i) => {
		if (letter == reference[i])
			intersection++;
	});
	

	let union = reference.length + word.length - intersection;

	return {
		// https://en.wikipedia.org/wiki/Jaccard_index
		jaccard: (intersection/union)
	};
}


let bestMatchByType = (matches, type, reverse) => {
	let words = Object.keys(matches);
	let bestMatch = words[0];

	words = words.sort((a, b) => {
		return matches[a][type] > matches[b][type] ? 1 : -1;
	});
	if(reverse) words = words.reverse();
	return words.slice(0, 15);
}


let checkDictionary = (word) => {
	let results = {};
	let d = dictionary;

	let searchDomain = [-1,0,1,2].reduce((total, current) => {
		return total.concat(d[word.length + current]);
	}, []);

	searchDomain.forEach((reference) => {
		results[reference] = compare(word, reference);
	});
	return {
		jaccard: bestMatchByType(results, 'jaccard', true),
		inDictionary: searchDomain.indexOf(word) !== -1
	};
}



let textWidth = function(text){
	$input = $(`<p class="simulate-input">${text}</p>`);
	let width = $input.appendTo($('body')).width();
	$input.remove();
 	return width;
};


$(document).ready(() => {

	let callbackId;

	let processText = () => {
		let $this = $('#enter-text');
		let value = $this.val().toLowerCase();
		$('.incorrect').hide();


		if(value.length > 0){

			// reset
			$('#autocomplete').val('');
			clearTimeout(callbackId);

			// delay to prevent oversearch
			callbackId = setTimeout(() => {

				let results = checkDictionary(value);

				if(!results.inDictionary)
					$('.incorrect').width(textWidth(value)).show();

				// suggestions
				let suggestions = results.jaccard;
				// remove duplicates
				suggestions = suggestions.filter(function(item, pos) {
					let isDup = suggestions.indexOf(item) !== pos,
						isValue = item === value;

				    return !isDup && !isValue;
				});
				// sort based on which array has
				// a greater intersection
				suggestions = suggestions.sort((a, b) => {
					let arr = value.split('');
					return arr.intersection(a).length > arr.intersection(b).length ? -1 : 1;
				});
				let maxLength = 9 - Math.round(value.length/3.5);
				suggestions = suggestions.slice(0, maxLength).sort((a, b) => {
					return b.length < value.length ? -1 : 0;
				});

				// display suggestions
				$('#suggestions').empty();
				suggestions.forEach((suggestion) => {
					let $p = $(`<p>${suggestion}</p>`);
					$('#suggestions').append($p);
				});

				// autocomplete
				if(suggestions[0].indexOf(value) == 0)
					$('#autocomplete').val(suggestions[0].matchcase($this.val()));

				else
					$('#autocomplete').val('');
			}, 400);
		}
	

		// clear suggestions
		else{
			clearTimeout(callbackId);
			$('#autocomplete').val('');
			$('#suggestions').empty();
		}
	};


	let lastValue = '';
	$('#enter-text')
	.keydown(function (e) {
		let key = e.keyCode;

	    if(key == 13)
			$('#enter-text').val($('#autocomplete').val());

		// control + these
        // keycodes are banned
        const isContrl = e.metaKey || e.ctrlKey;
        let ctrlBan = (isContrl) && [
            86 // control v
        ].includes(e.which);

        // new value isn't avable until
        // keyup event, so instead we simulate
        // the new value
        const cursorStart = this.selectionStart;
        const cursorEnd = this.selectionEnd;

        const escapedKey = [
            8,  // backspace,
            46, // delete key,
            13, // enter
            9,  // tab
            37,38,39,40 // arrow keys
        ].includes(e.which);

        // simulated new value but without cleanse
        let value = $('#enter-text').val();
        value = value.slice(0, cursorStart) + e.key + value.slice(cursorEnd);

        // deside if keypress is valid
        if(ctrlBan || !escapedKey && !/^[a-z]*$/i.test(value))
        	return false;
	})
	.keyup(function() {
		if($(this).val() !== lastValue)
			processText();
			lastValue = $(this).val();
	});


	// click to autocomplete
	$('#suggestions').on('click', 'p', function() {
		let value = $('#enter-text').val();
		$('#enter-text').val($(this).text().matchcase(value));
		processText();
	});
});