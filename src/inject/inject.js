chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);
		injected_classname = "yfm-yelp-rated";
		var restaurantsLoadedInterval = setInterval(function(){
			restaurants = document.querySelectorAll(".restaurant:not(."+injected_classname+")");
			if (restaurants && restaurants.length > 0) {

				//// THING THAT WORKS BUT IS REALLY SLOW ///
				// count = 0
				// restaurants.forEach(async(rnt) => {
				// 	rnt.classList.add("yfm-yelp-rated");

				// 	if (count < 5){
				// 		await getAndUseBusinessYelpInfo(
				// 				rnt,
				// 				rnt.getElementsByClassName("name")[0].innerText,
				// 				rnt.getElementsByClassName("address")[0].innerText
				// 			)
				// 	}
				// 	count++
				// })
				//// \\\ end THING THAT WORKS BUT IS REALLY SLOW ///

				restaurants_array = Array.from(restaurants);
				for (let i = 0; i < restaurants_array.length; i++) {
					let rnt = restaurants_array[i];
					rnt.classList.add("yfm-yelp-rated");
					star_container = document.createElement("div")
					star_container.classList = "yfm-star-container";
					star_container.innerText = "... loading reviews ...";
					rnt.append(star_container);


					let name = rnt.getElementsByClassName("name")[0].innerText;
					let address = rnt.getElementsByClassName("address")[0].innerText;
					getAndUseBusinessYelpInfo(rnt, name, address)
				}
			}
		}, 10)
	}
	}, 10);
});

function starImage(nStars){
	file_name = "icons/yelp_stars/regular_"
	if (nStars % 1 == 0){
		file_name += nStars
	} else {
		file_name += Math.floor(nStars) + "_half"
	}
	return chrome.extension.getURL(file_name + ".png")
}

function getRequestUrl(url, params){
	request_url = url
	if (params) {
		args = []
		for (key in params){
			args.push(key+"="+encodeURIComponent(params[key]))
		}

		request_url += "?"+args.join("&")
	}
	return request_url
}

async function getAndUseBusinessYelpInfo(restaurantElement, name, address, city="San Francisco", state="CA", country="US"){
	return new Promise((resolve, reject) => {
		yelpPromise = getBusinessYelpInfoPromise(name, address, city, state, country)
			.then((response) => {
				if (response && response.hasOwnProperty("rating")){
					star_container = restaurantElement.getElementsByClassName("yfm-star-container")[0];
					star_container.innerText = "";
					star_img = new Image();
					star_img.classList = "yfm-star-img";
					star_img.src = starImage(response.rating);
					star_container.append(star_img);

					review_count = document.createElement("span")
					review_count.classList = "yfm-star-review-count";
					review_count_text = document.createTextNode(response.review_count + " ratings");
					review_count.append(review_count_text);
					star_container.append(review_count);

					resolve(response);
				}
			})
			.catch((error) => {
				console.log(error)
				reject(error)
			});
	});
}

async function getBusinessYelpInfoPromise(name, address, city="San Francisco", state="CA", country="US"){
	return new Promise(function (resolve, reject) {
		let request_url = getRequestUrl("https://yelp-mealpal-server.herokuapp.com/business_rating", {
			name: name,
			address: address,
			city: city,
			state: state,
			country: country,
		});

		let req = new XMLHttpRequest();
		req.responseType = 'json';
		req.open("GET", request_url);
		req.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
    	req.setRequestHeader("Access-Control-Allow-Origin", "*");

		req.onload = function () {
	      if (this.status >= 200 && this.status < 300) {
	        resolve(req.response);
	      } else {
	        reject({
	          status: this.status,
	          statusText: req.statusText
	        });
	      }
	    };
	    req.onerror = function () {
	      reject({
	        status: this.status,
	        statusText: req.statusText
	      });
	    };
		req.send();
	});

}