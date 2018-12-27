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



let textWidth = function(text){
	$input = $(`<p class="simulate-input">${text}</p>`);
	let width = $input.appendTo($('body')).width();
	$input.remove();
 	return width;
};


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

	let hamming = 0;
	let intersection = 0;

	letters.slice(0, reference.length).forEach((letter, i) => {
		if (letter !== reference[i])
			hamming++;
		else
			intersection++;
	});
	hamming += Math.abs(word.length - reference.length);
	

	let union = reference.length + word.length - intersection;

	return {
		// https://en.wikipedia.org/wiki/Jaccard_index
		jaccard: (intersection/union),
		// https://en.wikipedia.org/wiki/Hamming_distance
		hamming: hamming
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

	let searchDomain = [-1,0,1,2,3].reduce((total, current) => {
		return total.concat(d[word.length + current]);
	}, []);

	searchDomain.forEach((reference) => {
		results[reference] = compare(word, reference);
	});
	return {
		hamming: bestMatchByType(results, 'hamming'),
		jaccard: bestMatchByType(results, 'jaccard', true),
		inDictionary: searchDomain.indexOf(word) !== -1
	};
}








$(document).ready(() => {

	let callbackId;



	let processText = () => {
		let $this = $('#enter-text');
		let caseAccurateValue = $this.val();
		let value = caseAccurateValue.toLowerCase();
		$('.incorrect').hide();


		if(value.length > 0){
			$('#autocomplete').val('');
			clearTimeout(callbackId);
			callbackId = setTimeout(() => {
				let results = checkDictionary(value);
				let matches = {
					hamming: results.hamming.map((str) => {
						return str.matchcase(caseAccurateValue);
					}),
					jaccard: results.jaccard.map((str) => {
						return str.matchcase(caseAccurateValue);
					})
				};

				if(!results.inDictionary)
					$('.incorrect').width(textWidth(value)).show();


				// suggestions
				let suggestions = matches.jaccard.intersection(matches.hamming).slice(0, 8);
				// remove duplicates
				suggestions = suggestions.filter(function(item, pos) {
					let isDuplicate = suggestions.indexOf(item) !== pos,
						isValue = item === caseAccurateValue;

				    return !isDuplicate && !isValue;
				});
				// sort based on which array has
				// a greater intersection
				suggestions = suggestions.sort((a, b) => {
					let arr = value.split('');
					return arr.intersection(a).length > arr.intersection(b).length ? -1 : 1;
				});

				$('#suggestions').empty();
				suggestions.forEach((suggestion) => {
					let $p = $(`<p>${suggestion}</p>`);
					$('#suggestions').append($p);
				});

				// autocomplete
				if(suggestions[0].indexOf(value) == 0)
					$('#autocomplete').val(suggestions[0]);

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



	$('#enter-text')
	.keydown(function (e) {
	    if (e.keyCode == 32) return false;
	    if(e.keyCode == 13){
			$('#enter-text').val($('#autocomplete').val());
			return false;
		}
	})
	.keyup(processText);


	// click to autocomplete
	$('#suggestions').on('click', 'p', function() {
		$('#enter-text').val($(this).text());
		processText();
	});
});