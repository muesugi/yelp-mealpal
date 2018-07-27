# Yelp for MealPal Chrome Extension

This chrome extension adds Yelp reviews and links to the standard MealPal /lunch page.

## Why?
MealPal allows you to purchase a set of meals (lunches, dinners), and within that meal plan, you can reserve your meal for the next day. Many of the businesses on MealPal take advantage of the discovery aspect of this service to list their meals, even/especially if they wouldn't otherwise be your first stop for lunch.

*But* as a consumer, you don't always want to make a gamble. This is where Yelp comes in-- Yelp ratings show how established a business is, and therefore, how much reputation they have to uphold when giving you your MealPal meal,


## How to use
Just download it, and then <a href="">add as unpacked extension in chrome</a>

## How it works
I set up a hobby nodejs backend for this project (separate repo), so this extension uses responses from this backend. Note that while the backend makes calls to Yelp Fusion API, since there's a daily limit of 5k calls to the API and every business rating find takes 2 calls, the backend caches these calls. Per Fusion docs, no data will ever be older than 24 hours!