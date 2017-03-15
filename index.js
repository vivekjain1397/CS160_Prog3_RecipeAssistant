var Alexa = require('alexa-sdk');
var AWS = require('aws-sdk');

exports.handler = function(event, context, callback){
    var alexa = Alexa.handler(event, context);
    alexa.dynamoDBTableName = 'Recipes';
    alexa.registerHandlers(newSessionHandlers, mainMenuHandlers, recipeModeHandlers, directionsHandlers);
    alexa.execute();
};

//helper functions and private variables
var states = {
    MAINMENU: '_MAINDIALOGUE',
    RECIPEDIALOGUE: '_RECIPEMODE',
    DIRECTIONSDIALOGUE: '_DIRECTIONSMODE'
};

var getRecipeFromIntent = function(intent){
	var recipeName = intent.slots.firstWord.value + " " +
				intent.slots.secondWord.value + " " +
				intent.slots.thirdWord.value + " " +
				intent.slots.fourthWord.value + " " +
				intent.slots.fifthWord.value + " " +
				intent.slots.sixthWord.value + " " +
				intent.slots.seventhWord.value;
	recipeName = recipeName.trimRight();
	return recipeName;
};

//this function implements reading from the DynamoDB– it is set up with my db right now
var EntryService = function(){
	this.dynamodb = new AWS.DynamoDB({endpoint: 'https://doitqrtbx7.execute-api.us-east-1.amazonaws.com/prod/RecipeUpdate'});
};

EntryService.prototype.read = function(recipeName, callback){
	var params = {
		TableName : "Recipes",
		Key: {
			RecipeName: {
				S: recipeName
			}
		},
		ProjectionExpression: {'Ingredients', 'Directions'}
	};
	this.dynamodb.getItem(params, callback);
};

//end helper functions and private variables

//handles starting the session
var newSessionHandlers = {
    'NewSession': function () {
        this.attributes['currentIngredientIndex'] = 0;
        this.attributes['currentDirectionsIndex'] = 0;
        this.attributes['currentRecipe'] = '';
    	this.handler.state = states.MAINMENU;
        this.emit(':ask', 'Recipe assistant here! What recipe would you like to make?', 'Please say which recipe you would like to make.');
    },

 };

//handles the main dialogue
 var mainMenuHandlers = Alexa.CreateStateHandler(states.MAINMENU, {

 	'MakeIntent': function () {
    	var action = this.event.request.intent.slots.act.value;
    	var recipe = getRecipeFromIntent(this.event.request.intent);
    	var readSuccessful = false;

    	var cb = function(result){
    		if (result){
    			readSuccessful = true;
    		}
    	};

    	EntryService.prototype.read(recipe, cb);

    	if (readSuccessful){
    		this.attributes['currentRecipe'] = recipe;
    		this.handler.state = states.RECIPEDIALOGUE;

    		if (action === 'make'){
    			this.emit(':tell', 'Okay! Let\'s make ' + recipe +'.');
    		}

    		if (action === 'find'){
    			this.emit(':tell', 'I found a recipe for ' + recipe +'.');
    		}
    	} else {
    		this.emit(':tell', 'I\'m sorry. I don\'t know that recipe.', 'Please enter the recipe for ' + recipe '.');
    	}
    	 
    };

 });

//handles the recipe dialogue
 var recipeModeHandlers = Alexa.CreateStateHandler(states.RECIPEDIALOGUE, {

 	//this intent handles reading the entire list of ingredients, and then entering the directions dialogue
 	'RecipeIntent': function(){
 		var currentRecipe = this.attributes['currentRecipe'];
 		var ingredients = '';

 		var cb = function(result){
 			ingredients = result.Item['Ingredients'].S;
 		};

 		EntryService.prototype.read(currentRecipe, cb);

 		//enter directions dialogue after reading ingredients
 		this.handler.state = states.DIRECTIONSDIALOGUE;
 		this.emit(':tell', 'To make ' + currentRecipe + ', you will need these ingredients.' + ingredients);
 	};

 	//this intent handles stepping through the ingredients one by one
 	'NextIngredientIntent': function(){
 		var currentRecipe = this.attributes['currentRecipe'];
 		var currentIngIndex = this.attributes['currentIngredientIndex'];
 		var ingredientsList = [];
 		var command = this.event.request.intent.slots.nextOrLast.value

 		var cb = function(result){
 			var ingredients = result.Item['Ingredients'].S;
 			ingredientsList = ingredients.split('\n');
 		};

 		EntryService.prototype.read(currentRecipe, cb);

 		if (command === 'next'){
 			this.attributes['currentIngredientIndex'] = currentIngIndex + 1;
 			this.emit(':tell', ingredientsList[currentIngIndex]);
 		}
 		if (command === 'last'){
 			this.attributes['currentIngredientIndex'] = ingredientsList.length;
 			this.emit(':tell', ingredientsList[ingredientsList.length - 1]);
 		}

 		//if we have reached the end of the ingredient list, enter the directions dialogue
 		if (this.attributes['currentIngredientIndex'] === ingredientsList.length){
 			this.handler.state = states.DIRECTIONSDIALOGUE;
 		}

 	};

 	//this intent handles the start again function. Note that this intent has nearly the same behavior in the directions dialogue state
 	'StartAgainIntent': function(){
 		var currentRecipe = this.attributes['currentRecipe'];
 		var ingredientsList = [];

 		var cb = function(result){
 			var ingredients = result.Item['Ingredients'].S;
 			ingredientsList = ingredients.split('\n');
 		};

 		EntryService.prototype.read(currentRecipe, cb);

 		this.attributes['currentIngredientIndex'] = 1;
 		this.emit(':tell', ingredientsList[0]);

 	};

 	//handles quitting and returning to the main menu. This intent is also in the directions dialogue state
 	'QuitIntent': function(){
 		this.attributes['currentIngredientIndex'] = 0;
 		this.attributes['currentDirectionsIndex'] = 0;
 		this.attributes['currentRecipe'] = '';
 		this.handler.state = states.MAINMENU;
 	};

 });

// handles the directions dialogue
 var directionsHandlers = Alexa.CreateStateHandler(states.DIRECTIONSDIALOGUE, {
 	
 	//this intent handles reading the entire list of directions
 	'readDirectionsIntent': function(){
 		var currentRecipe = this.attributes['currentRecipe'];
 		var directions = '';

 		var cb = function(result){
 			directions = result.Item['Directions'].S;
 		};

 		EntryService.prototype.read(currentRecipe, cb);

 		this.emit(':tell', directions);
 	};

 	//this intent handles stepping through the directions one by one
 	'NextIngredientIntent': function(){
 		var currentRecipe = this.attributes['currentRecipe'];
 		var currentDirIndex = this.attributes['currentDirectionsIndex'];
 		var directionsList = [];
 		var command = this.event.request.intent.slots.command.value

 		var cb = function(result){
 			var directions = result.Item['Directions'].S;
 			directionsList = directions.split('\n');
 		};

 		EntryService.prototype.read(currentRecipe, cb);

 		if (command === 'next'){
 			this.attributes['currentDirectionsIndex'] = currentDirIndex + 1;
 			this.emit(':tell', directionsList[currentDirIndex]);
 		}
 		if (command === 'last'){
 			this.emit(':tell', directionsList[directionsList.length - 1]);
 		}

 		//what do we do when we reach the end of the directions dialogue????

 	};

 	//this intent handles the start again function. Note that this intent has nearly the same behavior in the ingredients dialogue state
 	'StartAgainIntent': function(){
 		var currentRecipe = this.attributes['currentRecipe'];
 		var directionsList = [];

 		var cb = function(result){
 			var directions = result.Item['Directions'].S;
 			directionsList = directions.split('\n');
 		};

 		EntryService.prototype.read(currentRecipe, cb);

 		this.attributes['currentDirectionsIndex'] = 1;
 		this.emit(':tell', directionsList[0]);

 	};

 	//handles quitting and returning to the main menu. This intent is also in the ingredients dialogue state
 	'QuitIntent': function(){
 		this.attributes['currentIngredientIndex'] = 0;
 		this.attributes['currentDirectionsIndex'] = 0;
 		this.attributes['currentRecipe'] = '';
 		this.handler.state = states.MAINMENU;
 	};

 	}

 });
