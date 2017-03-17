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
        alexa.registerHandlers(newSessionHandlers, mainMenuHandlers);
        // recipeModeHandlers, directionsHandlers);
        alexa.appid = 'amzn1.ask.skill.0f0b54a5-a07c-4af0-8644-783c640f7afb';
        alexa.execute();
    }

};









// exports.handler = function(event, context, callback){
    
// };

//helper functions and private variables
var states = {
    MAINMENU: '_MAINDIALOGUE',
    RECIPEDIALOGUE: '_RECIPEMODE',
    DIRECTIONSDIALOGUE: '_DIRECTIONSMODE'
};

// var getRecipeFromIntent = function(intent){
    
//     return recipeName;
// };

//this function implements reading from the DynamoDB– it is set up with my db right now
// var dynamodb = new AWS.DynamoDB({endpoint: 'https://doitqrtbx7.execute-api.us-east-1.amazonaws.com/prod/RecipeUpdate'});

// var EntryService = function(){
//     this.dynamodb = new AWS.DynamoDB({endpoint: 'https://doitqrtbx7.execute-api.us-east-1.amazonaws.com/prod/RecipeUpdate'});

// };

var read = function(name, alexasdk){
    // var params = {
    //     TableName : 'Recipes',
    //     Key: {
    //         RecipeName: {S: name}
    //     }
    // };

    // console.log(params);
    // console.log(dynamo);

    var cb = function(err, res){

        console.log(res.Items);
        console.log(res.Items.length);

        var items = res.Items

        for (var i=0; i<items.length; i++){
            var item = items[i];

            console.log(item);
            console.log(name);
            console.log(item.RecipeName);

            if (item.RecipeName === name){

                alexasdk.emit(":tell", item.Directions);
            }
        }
        
    }

    dynamo.scan({TableName: 'Recipes'}, cb);


    // var request = new AWS.DynamoDB({region: 'us-east-1', apiVersion: '2012-08-10'}).getItem(params);
    // // log the name of the image file to load in the slot machine
    // request.on('success', function(response) {
    // // logs a value like "cherries.jpg" returned from DynamoDB
    //     this.attributes.currentDirections = response.data.Item.Directions.S;
    //     this.attributes.currentIngredients = response.data.Item.Ingredients.S;
    // });
    // // submit DynamoDB request
    // request.send();

};


//end helper functions and private variables
var newSessionHandlers = {

  'NewSession': function() {
    this.attributes.currentIngredientIndex = 0;
    this.attributes.currentDirectionsIndex = 0;
    this.attributes.currentIngredients = '';
    this.attributes.currentDirections = '';
    this.attributes.currentRecipe = '';
    this.handler.state = states.MAINMENU;

    this.emit(':ask', 'Recipe assistant here! What recipe would you like to make?', 'Please say which recipe you would like to make.');

   }

 };

//handles the main dialogue
 var mainMenuHandlers = Alexa.CreateStateHandler(states.MAINMENU, {

    // 'LaunchRequest': function () {
    //     this.attributes.currentIngredientIndex = 0;
    //     this.attributes.currentDirectionsIndex = 0;
    //     this.attributes.currentRecipe = '';
    //     this.handler.state = states.MAINMENU;
    //     this.emit(':ask', 'Recipe assistant here! What recipe would you like to make?', 'Please say which recipe you would like to make.');
    // },


    'MakeIntent': function () {
        var action = this.event.request.intent.slots.act.value;
        var recipe = this.event.request.intent.slots.recipe.value;

        var currentrecipe = '';
        var ingredients = '';
        var directions = '';

        // this.emit(':tell', recipe);
        // console.log(recipe);
        // console.log(action);
        console.log(this);

        // var cb = function(err, res){

        //     console.log(err);
        //     console.log(res);
        //     console.log(this);

        //     'MakeIntent'.emit(res);

        //     // if (res){
                
        //     //     currentrecipe = recipe;
        //     //     ingredients = res.data.Item.Ingredients;
        //     //     this.attributes.currentDirections = res.data.Item.Directions;
        //     //     this.handler.state = states.RECIPEDIALOGUE;

        //     //     if (action === 'make'){
        //     //         this.emit(':tell', 'Okay! Let\'s make ' + recipe +'.');
        //     //     }

        //     //     if (action === 'find'){
        //     //         this.emit(':tell', 'I found a recipe for ' + recipe +'.');
        //     //     }

        //     // } else {
        //     //     console.log("at else");
        //     // }

        // };


        read(recipe, this);



        // if (readSuccessful){
        //     this.attributes.currentRecipe = recipe;
        //     this.handler.state = states.RECIPEDIALOGUE;

        //     if (action === 'make'){
        //         this.emit(':tell', 'Okay! Let\'s make ' + recipe +'.');
        //     }

        //     if (action === 'find'){
        //         this.emit(':tell', 'I found a recipe for ' + recipe +'.');
        //     }
        // } else {
        //     this.emit( ':tell', 'I\'m sorry. I don\'t know that recipe.', 'Please enter the recipe for ' + recipe + '.' );
        // }
         
    }

 });

// //handles the recipe dialogue
//  var recipeModeHandlers = Alexa.CreateStateHandler(states.RECIPEDIALOGUE, {

//     //this intent handles reading the entire list of ingredients, and then entering the directions dialogue
//     'RecipeIntent': function(){
//         var currentRecipe = this.attributes.currentRecipe;
//         var ingredients = '';

//         var cb = function(result){
//             ingredients = result.Item.Ingredients.S;
//         };

//         EntryService.prototype.read(currentRecipe, cb);

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
