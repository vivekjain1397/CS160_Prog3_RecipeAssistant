'use strict';

// This VUI implementation uses the Alexa Skill Kit SDK for Node.js, which is available at https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs.
var Alexa = require('alexa-sdk');
var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});


console.log('Loading function');

const doc = require('dynamodb-doc');

//The recipe dynamo database
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
            'Access-Control-Allow-Headers': 'x-Requested-With',
            'Access-Control-Allow-Origin': '*',
            "Access-Control-Allow-Credentials" : true,
            'Content-Type': 'application/json',
            },
        });

        switch (event.httpMethod) {
            case 'GET':
                dynamo.scan({ TableName: event.queryStringParameters.TableName }, done);
                break;
            case 'POST':
                var json = JSON.parse(event.body);
                if (json["type"] == 'POST') {
                    dynamo.putItem(json["data"], done);
                }
                else if (json["type"] == 'PUT') {
                    dynamo.updateItem(json["data"], done);
                }
                else if (json["type"] == 'DELETE') {
                    dynamo.deleteItem(json["data"], done);
                }
                else if (json["type"] == 'QUERY') {
                    dynamo.scan(json["data"], done);
                } else{
                    done(new Error(`Unsupported method "${json["type"]}"`))
                }
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

// This VUI implementation uses the Alexa Skill Kit SDK for Node.js package, which is available at https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs.


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
                        alexasdk.emit(":ask", "Okay! I found a recipe for " + name + ".", "Say ingredients to hear the ingredients for this recipe. Say start to begin making this recipe.");
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
    
        this.emit(':ask', 'Recipe assistant here! What recipe would you like to make?', 'Please say the name of a recipe you would like to make.');

    },


    'MakeIntent': function () {

        var recipe = this.event.request.intent.slots.recipe.value;

        console.log(recipe);


        helpers.read(recipe, this);
         
    },

    'RecipeIntent': function(){

        if (!helpers.currentRecipeItem){
            this.emit(':ask', "You haven\'t told me which recipe you want to make!", "Please say the name of a recipe you would like to make.");
        }

        this.emit('StartAgainIntent');
    },

    'NextIngredientIntent': function(){

        if (!helpers.currentRecipeItem){
            this.emit(':ask', "You haven\'t told me which recipe you want to make!", "Please say the name of a recipe you would like to make.");
        }

        var currentIngIndex = helpers.currentIngredientIndex;
        var ingredientsList = helpers.currentRecipeItem.Ingredients.split('\n');
        var command = this.event.request.intent.slots.nextOrLast.value;

        if (command === 'next'){
            
            //check if this is the end of the list, enter recipe dialog
            if (helpers.currentIngredientIndex === ingredientsList.length){

                helpers.currentIngredientIndex = 0;
                helpers.currentDialog = states.DIRECTIONSDIALOGUE;
                this.emit(':ask', "That\'s all of the ingredients. Say, read recipe, to begin listing recipe directions, or, quit recipe, to return to the main menu.");
            };

            helpers.currentIngredientIndex = currentIngIndex + 1;

            this.emit(':ask', ingredientsList[currentIngIndex]);
            
            
        } else {
            //command is last. read the last ingredient and enter directions dialog
            helpers.currentIngredientIndex = ingredientsList.length;
            helpers.currentDialog = states.DIRECTIONSDIALOGUE;

            this.emit(':ask', ingredientsList[ingredientsList.length - 1] );
        }


    },
    'StartAgainIntent': function(){

        if (!helpers.currentRecipeItem){
            this.emit(':ask', "You haven\'t told me which recipe you want to make!", "Please say the name of a recipe you would like to make.");
        }

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
        if (helpers.currentDialog === states.MAINMENU){
            this.emit(':ask', "Say, I'd like to make, and then the name of a recipe. Or, say find, and then the name of a recipe.");
        }
        if (helpers.currentDialog === states.RECIPEDIALOGUE){
            this.emit(':ask', "Say, ingredients, to hear the ingredients for " +helpers.currentRecipeItem.RecipeName+ ". Say, next ingredient, to begin listing ingredients one by one. Say, start again, if you want to restart from the first ingredient");
        }
        if (helpers.currentDialog === states.DIRECTIONSDIALOGUE){
            this.emit(':ask', "Say, read recipe, to hear the full recipe. Say, next step, to begin listing the directions one by one. Say, start again, if you want to restart from the first direction.");
        }
        
    },

    //handles quitting and returning to the main menu. This intent is also in the directions dialogue state
    'QuitIntent': function(){

        helpers.currentDirectionsIndex = 0;
        helpers.currentIngredientIndex = 0;
        helpers.currentRecipeItem = null;
        helpers.currentDialog = states.MAINMENU;


        this.emit(':ask', "Which recipe would you like to make?", "Please say the name of a recipe you would like to make.");
    },

    'readDirectionsIntent': function(){

        if (!helpers.currentRecipeItem){
            this.emit(':ask', "You haven\'t told me which recipe you want to make!", "Please say the name of a recipe you would like to make.");
        }

        //if you ask for the directions and we are not in the directions dialogue, enter the directions dialog
        helpers.currentDialog = states.DIRECTIONSDIALOGUE;

        this.emit('StartAgainIntent');
    },

    'NextDirectionIntent': function(){

        if (!helpers.currentRecipeItem){
            this.emit(':ask', "You haven\'t told me which recipe you want to make!", "Please say the name of a recipe you would like to make.");
        }

        //if you ask for the directions and we are not in the directions dialogue, enter the directions dialog
        helpers.currentDialog = states.DIRECTIONSDIALOGUE;

        var directionsList = helpers.currentRecipeItem.Directions.split('\n');
        var currentDirIndex = helpers.currentDirectionsIndex;
        var command = this.event.request.intent.slots.command.value;
        
        if (command === 'next'){

            if (helpers.currentDirectionsIndex === directionsList.length){
                helpers.currentDirectionsIndex = 0;
                this.emit(':ask', 'That\'s the last step in the recipe! Say, start again, to read the directions again, or, quit recipe, to return to the main menu.');
            }

            helpers.currentDirectionsIndex = currentDirIndex + 1;
            this.emit(':ask', directionsList[currentDirIndex]);

        } else {
            //command is last
            helpers.currentDirectionsIndex = directionsList.length;
            this.emit(':ask', directionsList[directionsList.length - 1]);
        }

        //what do we do when we reach the end of the directions dialogue????

    },

    'AMAZON.HelpIntent': function(){
        this.emit('WhatCanISayIntent');
    },

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

