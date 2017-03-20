'use strict';
var Alexa = require('alexa-sdk');
var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});


console.log('Loading function');

const doc = require('dynamodb-doc');

const dynamo = new doc.DynamoDB();


/**
 * Demonstrates a simple HTTP endpoint using API Gateway. You have full
 * access to the request and response payload, including headers and
 * status code.
 *
 * To scan a DynamoDB table, make a GET request with the TableName as a
 * query string parameter. To put, update, or delete an item, make a POST,
 * PUT, or DELETE request respectively, passing in the payload to the
 * DynamoDB API as a JSON body.
 */
exports.handler = (event, context, callback) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));

    //handles http requests ir this is an http request
    if (event.httpMethod){
        const done = (err, res) => callback(null, {
            statusCode: err ? '400' : '200',
            body: err ? err.message : JSON.stringify(res),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        switch (event.httpMethod) {
            case 'DELETE':
                dynamo.deleteItem(JSON.parse(event.body), done);
                break;
            case 'GET':
                dynamo.scan({ TableName: event.queryStringParameters.TableName }, done);
                break;
            case 'POST':
                dynamo.putItem(JSON.parse(event.body), done);
                break;
            case 'PUT':
                dynamo.updateItem(JSON.parse(event.body), done);
                break;
            default:
                done(new Error(`Unsupported method "${event.httpMethod}"`));
        }

    //else this is an alexa request
    } else {



        var alexa = Alexa.handler(event, context);
        // alexa.dynamoDBTableName = 'Recipes';
        alexa.appId = 'amzn1.ask.skill.0f0b54a5-a07c-4af0-8644-783c640f7afb';
        alexa.registerHandlers(handlers);
            // , directionsHandlers);
        alexa.execute();
    }

};


//helper functions and private variables
var states = {
    MAINMENU: '_MAINDIALOGUE',
    RECIPEDIALOGUE: '_RECIPEMODE',
    DIRECTIONSDIALOGUE: '_DIRECTIONSMODE'
};

var helpers = {

    currentDialog: null,
    currentIngredientIndex: 0,
    currentDirectionsIndex: 0,

    currentRecipeItem: null,

    read: function(name, alexasdk) {

        var cb = function(err, res){
            if (res){
                var items = res.Items;
                for (var i=0; i<items.length; i++){
                    var item = items[i];
                    if (item.RecipeName === name){
                        helpers.currentRecipeItem = item;
                        helpers.currentDialog = states.RECIPEDIALOGUE;
                        alexasdk.emit(":ask", "Okay! I found a recipe for " + name + ".");
                    }
                }
                //no recipe found
                alexasdk.emit(":ask", "I'm sorry. I don't know that recipe.", "Add a recipe for " + name + " or say a different recipe.");

            } else {
                //no recipe table
                alexasdk.emit(":ask", "You haven't added any recipes yet!", "Add some recipes to get started, then say a recipe you would like to make.");
            }
        };

        dynamo.scan({TableName: 'Recipes'}, cb);
    }
};


 var handlers = {

    'LaunchRequest': function() {

        helpers.currentDialog = states.MAINMENU;
    
        this.emit(':ask', 'Recipe assistant here! What recipe would you like to make?', 'Please say which recipe you would like to make.');

    },


    'MakeIntent': function () {

        var recipe = this.event.request.intent.slots.recipe.value;


        // console.log(this);
        // console.log(this.ShouldEndSession);
        // console.log(this.response);
        // console.log(this.response.ShouldEndSession);
        // console.log(this.response.listen);


        helpers.read(recipe, this);
         
    },

    'RecipeIntent': function(){

        var ingredientsList = helpers.currentRecipeItem.Ingredients.split('\n');
        var response = '';

        for (var i = 0; i<ingredientsList.length ; i++){
            response += ingredientsList[i] + ". ";
        }


        //enter directions dialogue after reading ingredients
        helpers.currentDialog = states.DIRECTIONSDIALOGUE;
        this.emit(':ask', 'You will need these ingredients: ' + response);
    },

    'NextIngredientIntent': function(){



        var currentIngIndex = helpers.currentIngredientIndex;
        var ingredientsList = helpers.currentRecipeItem.Ingredients.split('\n');
        var command = this.event.request.intent.slots.nextOrLast.value;

        if (command === 'next'){
            helpers.currentIngredientIndex = currentIngIndex + 1;
            
            //check if this is the end of the list, enter recipe dialog
            if (helpers.currentIngredientIndex === ingredientsList.length){

                helpers.currentIngredientIndex = 0;
                helpers.currentDialog = states.DIRECTIONSDIALOGUE;
            };

            this.emit(':ask', ingredientsList[currentIngIndex]);
            
            
        } else {
            //command is last. read the last ingredient and enter directions dialog
            helpers.currentIngredientIndex = 0;
            helpers.currentDialog = states.DIRECTIONSDIALOGUE;

            this.emit(':ask', ingredientsList[ingredientsList.length - 1] );
        }


    },
    'StartAgainIntent': function(){
        //start again from recipe dialog
        if (helpers.currentDialog === states.RECIPEDIALOGUE) {
            var ingredientsList = helpers.currentRecipeItem.Ingredients.split('\n');
            helpers.currentIngredientIndex = 1;
            this.emit(':ask', ingredientsList[0]);
        } else {
        //start again from directions dialog – extend this logic to start again in different states
            var directionsList = helpers.currentRecipeItem.Directions.split('\n');
            helpers.currentDirectionsIndex = 1;
            this.emit(':ask', directionsList[0]);

        }
    },

    'WhatCanISayIntent': function(){
        this.emit(':ask', "Say I'd like to make, and then the name of a recipe. Or, say find, and then the name of a recipe.");
    },

    //handles quitting and returning to the main menu. This intent is also in the directions dialogue state
    'QuitIntent': function(){

        helpers.currentDirectionsIndex = 0;
        helpers.currentIngredientIndex = 0;
        helpers.currentRecipeItem = null;
        helpers.currentDialog = states.MAINMENU;


        this.emit(':ask', "Which recipe would you like to make?");
    },

    'readDirectionsIntent': function(){

        //if you ask for the directions and we are not in the directions dialogue, enter the directions dialog
        helpers.currentDialog = states.DIRECTIONSDIALOGUE;
        

        var directionsList = helpers.currentRecipeItem.Directions.split('\n');
        var response = '';

        for (var i = 0; i<directionsList.length ; i++){
            response += directionsList[i] + ". ";
        }

        this.emit(':ask', response);
    },

    'NextDirectionIntent': function(){

        var directionsList = helpers.currentRecipeItem.Directions.split('\n');
        var currentDirIndex = helpers.currentDirectionsIndex;
        var command = this.event.request.intent.slots.command.value;
        
        if (command === 'next'){
            helpers.currentDirectionsIndex = currentDirIndex + 1;
            this.emit(':ask', directionsList[currentDirIndex]);
        } else {
            //command is last
            helpers.currentDirectionsIndex = 0;
            this.emit(':ask', directionsList[directionsList.length - 1]);
        }

        //what do we do when we reach the end of the directions dialogue????

    },

    // 'AMAZON.StopIntent': function(){
    //     if (!(helpers.currentDialog === states.MAINMENU)){
    //         helpers.currentIngredientIndex = 0;
    //         helpers.currentDirectionsIndex = 0;
    //         helpers.currentRecipeItem = null;
    //         helpers.currentDialog = states.MAINMENU;

    //         this.emit(':ask', "What recipe would you like to make?", 'Please say which recipe you would like to make.');
    //     }else{
    //         this.succeed();
    //     }
    // },

    'Unhandled': function() {
        var msg = 'Sorry, I didn\'t get that. ';

        if (helpers.currentRecipeItem){
            msg = msg + 'Say ingredients to hear the ingredients for this recipe. Say start to begin making this recipe.';
        } else {
            msg = msg + 'Please say which recipe you would like to make.';
        }

        this.emit(':ask', msg, msg);
    }

 };

// //handles the recipe dialogue
//  var recipeModeHandlers = Alexa.CreateStateHandler(states.RECIPEDIALOGUE, {

//     //this intent handles reading the entire list of ingredients, and then entering the directions dialogue
//     'RecipeIntent': function(){
//         var ingredients = this.attributes.currentRecipeItem.Ingredients;


//         //enter directions dialogue after reading ingredients
//         this.handler.state = states.DIRECTIONSDIALOGUE;
//         this.emit(':tell', 'To make ' + currentRecipe + ', you will need these ingredients.' + ingredients);
//     },
 
//     //this intent handles stepping through the ingredients one by one
//     'NextIngredientIntent': function(){
//         var currentRecipe = this.attributes.currentRecipe;
//         var currentIngIndex = this.attributes.currentIngredientIndex;
//         var ingredientsList = [];
//         var command = this.event.request.intent.slots.nextOrLast.value;

//         var cb = function(result){
//             var ingredients = result.Item.Ingredients.S;
//             ingredientsList = ingredients.split('\n');
//         };

//         EntryService.prototype.read(currentRecipe, cb);

//         if (command === 'next'){
//             this.attributes.currentIngredientIndex = currentIngIndex + 1;
//             this.emit(':tell', ingredientsList[currentIngIndex]);
//         }
//         if (command === 'last'){
//             this.attributes.currentIngredientIndex = ingredientsList.length;
//             this.emit(':tell', ingredientsList[ingredientsList.length - 1]);
//         }

//         //if we have reached the end of the ingredient list, enter the directions dialogue
//         if (this.attributes.currentIngredientIndex === ingredientsList.length){
//             this.handler.state = states.DIRECTIONSDIALOGUE;
//         }

//     },

//     //this intent handles the start again function. Note that this intent has nearly the same behavior in the directions dialogue state
//     'StartAgainIntent': function(){
//         var currentRecipe = this.attributes.currentRecipe;
//         var ingredientsList = [];

//         var cb = function(result){
//             var ingredients = result.Item.Ingredients.S;
//             ingredientsList = ingredients.split('\n');
//         };

//         EntryService.prototype.read(currentRecipe, cb);

//         this.attributes.currentIngredientIndex = 1;
//         this.emit(':tell', ingredientsList[0]);

//     },

//     //handles quitting and returning to the main menu. This intent is also in the directions dialogue state
//     'QuitIntent': function(){
//         this.attributes.currentIngredientIndex = 0;
//         this.attributes.currentDirectionsIndex = 0;
//         this.attributes.currentRecipe = '';
//         this.handler.state = states.MAINMENU;
//     }

//  });

// // handles the directions dialogue
//  var directionsHandlers = Alexa.CreateStateHandler(states.DIRECTIONSDIALOGUE, {
    
//     //this intent handles reading the entire list of directions
//     'readDirectionsIntent': function(){
//         var currentRecipe = this.attributes.currentRecipe;
//         var directions = '';

//         var cb = function(result){
//             directions = result.Item.Directions.S;
//         };

//         EntryService.prototype.read(currentRecipe, cb);

//         this.emit(':tell', directions);
//     },

//     //this intent handles stepping through the directions one by one
//     'NextDirectionIntent': function(){
//         var currentRecipe = this.attributes.currentRecipe;
//         var currentDirIndex = this.attributes.currentDirectionsIndex;
//         var directionsList = [];
//         var command = this.event.request.intent.slots.command.value;

//         var cb = function(result) {
//             var directions = result.Item.Directions.S;
//             directionsList = directions.split('\n');
//         };

//         EntryService.prototype.read(currentRecipe, cb);

//         if (command === 'next'){
//             this.attributes.currentDirectionsIndex = currentDirIndex + 1;
//             this.emit(':tell', directionsList[currentDirIndex]);
//         }
//         if (command === 'last'){
//             this.emit(':tell', directionsList[directionsList.length - 1]);
//         }

//         //what do we do when we reach the end of the directions dialogue????

//     },

//     //this intent handles the start again function. Note that this intent has nearly the same behavior in the ingredients dialogue state
//     'StartAgainIntent': function(){
//         var currentRecipe = this.attributes.currentRecipe;
//         var directionsList = [];

//         var cb = function(result){
//             var directions = result.Item.Directions.S;
//             directionsList = directions.split('\n');
//         };

//         EntryService.prototype.read(currentRecipe, cb);

//         this.attributes.currentDirectionsIndex = 1;
//         this.emit(':tell', directionsList[0]);

//     },

//     //handles quitting and returning to the main menu. This intent is also in the ingredients dialogue state
//     'QuitIntent': function(){
//         this.attributes.currentIngredientIndex = 0;
//         this.attributes.currentDirectionsIndex = 0;
//         this.attributes.currentRecipe = '';
//         this.handler.state = states.MAINMENU;
//     }


//  });
