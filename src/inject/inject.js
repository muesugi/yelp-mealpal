saved_loc = {city: null, state: null, country: null}

chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);
		forceKitchenOpen(document);
		injected_classname = "yfm-yelp-rated";
		var restaurantsLoadedInterval = setInterval(function(){
			restaurants = document.querySelectorAll(".restaurant:not(."+injected_classname+")");
			if (restaurants && restaurants.length > 0) {
				if (!saved_loc.city) tryToPopulateSavedLoc(document);

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
					getAndUseBusinessYelpInfo(
						rnt,
						name,
						address,
						saved_loc.city,
						saved_loc.state,
						saved_loc.country,
					);
				}
			}
		}, 10)
	}
	}, 10);
});


function forceKitchenOpen(document){
	var script = `
		forced = false
		//window.__env.environment = "dev"
		setInterval(function() {
			scope = angular.element($(".kitchen--lunch")).scope();
			if (scope && !forced){
				scope.bigBoy.kitchenIsOpen = true;
				scope.bigBoy.planner.mealpal_now = true;
				weekdays = scope.bigBoy.planner.weekdays
				scope.bigBoy.planner.weekdays[weekdays.length - 1].lunch.kitchen_mode = 'open';
				scope.bigBoy.planner.weekdays[weekdays.length - 1].lunch.kitchen_status = 'OPEN';
				scope.bigBoy.planner.weekdays[weekdays.length - 1].isReservable = true;
				scope.bigBoy.planner.weekdays[weekdays.length - 1].reserve_until = "2018-07-27T023:00:00-07:00";
				scope.$apply();
				console.log(scope.bigBoy)
				forced = true;
			}
		}, 100);
	`;
	var scriptEl = document.createElement('script');
	scriptEl.textContent = script;
	document.head.appendChild(scriptEl);
}

function tryToPopulateSavedLoc(document){
	var cityScript = `
		ang_element = angular.element( document.querySelector(".filters-wrapper"));
		if (ang_element && ang_element.scope().city){
			city_object = ang_element.scope().city;

			city_container = document.createElement('div');
			city_container.classList = 'yfm-hidden yfm-city-container';

			city_data = document.createElement('span');
			city_data.classList = 'yfm-city-city';
			city_data.innerText = city_object.name;

			state_data = document.createElement('span');
			state_data.classList = 'yfm-city-state';
			state_data.innerText = city_object.state;

			country_data = document.createElement('span');
			country_data.classList = 'yfm-city-country';
			country_data.innerText = city_object.countryCodeAlphaTwo.toUpperCase();

			city_container.append(city_data);
			city_container.append(state_data);
			city_container.append(country_data);

			document.getElementById('app').append(city_container);
		}
	`;

	var cityScriptEl = document.createElement('script');
	cityScriptEl.textContent = cityScript;
	cityScriptEl.async = false;
	document.body.appendChild(cityScriptEl);

	 if (document.getElementsByClassName('yfm-city-container').length > 0){
		city_container = document.getElementsByClassName('yfm-city-container')[0];
		saved_loc.city = city_container.getElementsByClassName('yfm-city-city')[0].innerText;
		saved_loc.state = city_container.getElementsByClassName('yfm-city-state')[0].innerText;
		saved_loc.country = city_container.getElementsByClassName('yfm-city-country')[0].innerText;
	}
}

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


					overlayElement = restaurantElement.nextElementSibling;
					checking = 0;
					var isFadeBoxOverlay = ((element) => element.classList && element.classList.contains("fade-box--meal-overlay"));
					while (!isFadeBoxOverlay(overlayElement) && checking < 3){
						overlayElement = overlayElement.nextElementSibling;
						checking++;
					}
					if( isFadeBoxOverlay(overlayElement) ){
						linkToBusiness =  document.createElement('a');
						linkToBusiness.appendChild(document.createTextNode("Open on Yelp!"));
						linkToBusiness.href = "http://yelp.com/biz/" + response.alias;

						linkToMealPalReviews =  document.createElement('a');
						linkToMealPalReviews.appendChild(document.createTextNode("Read only MealPal reviews"));
						linkToMealPalReviews.href = "http://yelp.com/biz/" + response.alias + "?q=MealPal";

						overlayElement.insertBefore(linkToMealPalReviews,
							overlayElement.getElementsByClassName("description")[0].nextElementSibling);

						overlayElement.insertBefore(linkToBusiness,linkToMealPalReviews);
					}

					resolve(response);
				}
			})
			.catch((error) => {
				if (error.status >= 400 && error.status < 500){
					star_container = restaurantElement.getElementsByClassName("yfm-star-container")[0];
					if (error.status == 404){
						star_container.innerText = "Couldn't find this business on Yelp :(";
					} else {
						star_container.innerText = "This business has not been rated on Yelp!";
					}
				} else {
					console.log(error);
					reject(error);
				}
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