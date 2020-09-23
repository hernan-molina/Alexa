// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');
var https = require('https');


var config = {
    "projectID": "8DB28CD04256DA6D1A1809A98B411288",
    "username" : "administrator",
    "password": "mstrategy2468",
    "webserver" : "alexa.iflow21.com",
    "cubeID" : "71A7A5284292A2227A31E9A3B8CC0AF7",
};


//Replace with your app ID (OPTIONAL).  You can find this value at the top of your skill's page on http://developer.amazon.com.
//Make sure to enclose your value in quotes, like this: const APP_ID = 'amzn1.ask.skill.bb4045e6-b3e8-4133-b650-72923c5980f1';
const APP_ID = undefined;

const SKILL_NAME = 'Space Facts';
const HELP_MESSAGE = ' What can I help you with?';
const HELP_REPROMPT = 'What can I help you with?';
const STOP_MESSAGE = 'Goodbye!';


const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Hola, que información querés saber sobre aiflow';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const HelloWorldIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HelloWorldIntent';
    },
    handle(handlerInput) {

        console.log("entro en dataIntent 1");
        
        var me = this;
        
        var speechOutput = getRestSession(function(error, token, cookie){
            //speak error if present:
            if(error){
                me.response.speak(error);
                me.emit(':responseReady');
                return;
            }
            //continue: -> mstr token/cookie are present
            console.log("MSTR Token present, continue");
            
            //Now query desired data from cube:
            getCubeDefinition(token, cookie, config.cubeID, function(error, cubeDef){
                if(error){
                    me.response.speak(error);
                    me.emit(':responseReady');
                    return;
                }
                console.log("Got cubeDef");
                
                console.log(cubeDef);
                //Have cubeDef -> now send POST to cube with desired template objects + filters
                
                var requiredAttributeNames = ['planta'];
                var requiredMetricNames = ['bulto confirmado'];
                
                //Form cubePost data based on required attributes, metrics, and filters
                //NOTE -> ORDER OF FILTERS SEEM TO MATTER. START FROM LEFT TO RIGHT BASED ON ATTRIBUTES ADDED
                var filters = [];
                var postData = formCubePostData(cubeDef, requiredAttributeNames, requiredMetricNames, filters);
                console.log(JSON.stringify(postData));
            
                getCubeData(token, cookie,config.cubeID, postData, function(err, cubeData){
                    if(err){
                        console.log("have error: " + err);
                        me.response.speak(err);
                        me.emit(':responseReady');
                        return;
                    }
                
                    console.log("Have cube data:");
                    console.log(JSON.stringify(cubeData));
                    
                    var metricValue = null;
                
                    var root = cubeData.result.data.root;
                    //console.log(root);
                    var child = getLastChild(root);
                    console.log("last child");
                    console.log(JSON.stringify(child));
                    var metrics = child.metrics;
                    var metricName = Object.keys(metrics)[0];
                    var metric = metrics[metricName];
                    metricValue = metric.fv;
                    
                    speechOutput = "Bultos Confirmados " + metricValue;
                    
                    console.log(speechOutput);

                    return speechOutput;
                });
            });
        });


        console.log("llegó al final");
        console.log(speechOutput);

        return handlerInput.responseBuilder
        .speak(speechOutput)
        .reprompt("¿Quieres saber otra información?")
        .getResponse();

    }
};
const MetricaIntentHandler = {
    canHandle(handlerInput) {
        console.log(Alexa.getIntentName(handlerInput.requestEnvelope));
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'MetricaIntentHandler';
    },
    handle(handlerInput) {

        console.log("entro en MetricaIntentHandler");
        console.log("Metrica: " +  handlerInput.requestEnvelope.request.intent.slots.metrica.value);

        var me = this;
        
        var speechOutput = getRestSession(function(error, token, cookie){
            //speak error if present:
            if(error){
                me.response.speak(error);
                me.emit(':responseReady');
                return;
            }
            //continue: -> mstr token/cookie are present
            console.log("MSTR Token present, continue");
            
            //Now query desired data from cube:
            getCubeDefinition(token, cookie, config.cubeID, function(error, cubeDef){
                if(error){
                    me.response.speak(error);
                    me.emit(':responseReady');
                    return;
                }
                console.log("Got cubeDef");
                
                console.log(cubeDef);
                //Have cubeDef -> now send POST to cube with desired template objects + filters
                
                var requiredAttributeNames = ['planta'];
                var requiredMetricNames = [handlerInput.requestEnvelope.request.intent.slots.metrica.value.string];
                
                //Form cubePost data based on required attributes, metrics, and filters
                //NOTE -> ORDER OF FILTERS SEEM TO MATTER. START FROM LEFT TO RIGHT BASED ON ATTRIBUTES ADDED
                var filters = [];
                var postData = formCubePostData(cubeDef, requiredAttributeNames, requiredMetricNames, filters);
                console.log(JSON.stringify(postData));
            
                getCubeData(token, cookie,config.cubeID, postData, function(err, cubeData){
                    if(err){
                        console.log("have error: " + err);
                        me.response.speak(err);
                        me.emit(':responseReady');
                        return;
                    }
                
                    console.log("Have cube data:");
                    console.log(JSON.stringify(cubeData));
                    
                    var metricValue = null;
                
                    var root = cubeData.result.data.root;
                    //console.log(root);
                    var child = getLastChild(root);
                    console.log("last child");
                    console.log(JSON.stringify(child));
                    var metrics = child.metrics;
                    var metricName = Object.keys(metrics)[0];
                    var metric = metrics[metricName];
                    metricValue = metric.fv;
                    
                    speechOutput = "Bultos Confirmados " + metricValue;
                    
                    console.log(speechOutput);

                    return speechOutput;
                });
            });
        });


        console.log("llegó al final");
        console.log(speechOutput);

        return handlerInput.responseBuilder
        .speak(speechOutput)
        .reprompt("¿Quieres saber otra información?")
        .getResponse();

    }
};
const MetricaPlantaIntentHandler = {
    canHandle(handlerInput) {
        console.log(Alexa.getIntentName(handlerInput.requestEnvelope));
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'MetricaPlantaIntentHandler';
    },
    handle(handlerInput) {

        console.log("entro en MetricaPlantaIntentHandler");
        console.log("Metrica: " +  handlerInput.requestEnvelope.request.intent.slots.metrica.value);

        var requiredMetricNames = [handlerInput.requestEnvelope.request.intent.slots.metrica.value.string];
        var planta = handlerInput.requestEnvelope.request.intent.slots.planta.value;

        var me = this;
        
        var speechOutput = getRestSession(function(error, token, cookie){
            //speak error if present:
            if(error){
                me.response.speak(error);
                me.emit(':responseReady');
                return;
            }
            //continue: -> mstr token/cookie are present
            console.log("MSTR Token present, continue");
            
            //Now query desired data from cube:
            getCubeDefinition(token, cookie, config.cubeID, function(error, cubeDef){
                if(error){
                    me.response.speak(error);
                    me.emit(':responseReady');
                    return;
                }
                console.log("Got cubeDef");
                
                console.log(cubeDef);
                //Have cubeDef -> now send POST to cube with desired template objects + filters

                console.log(handlerInput.requestEnvelope.request.intent.slots.metrica.value.string);

                
                var requiredAttributeNames = ['planta'];
                
                //Form cubePost data based on required attributes, metrics, and filters
                //NOTE -> ORDER OF FILTERS SEEM TO MATTER. START FROM LEFT TO RIGHT BASED ON ATTRIBUTES ADDED
                //var filters = [{'name':'Planta', 'element':planta, 'type':'attribute'},{'name':'Subcategory', 'element':subcategory, 'type':'attribute'}];
                var filters = [{'name':'planta', 'element':planta, 'type':'attribute'}];

                var postData = formCubePostData(cubeDef, requiredAttributeNames, requiredMetricNames, filters);
                console.log(JSON.stringify(postData));
            
                getCubeData(token, cookie,config.cubeID, postData, function(err, cubeData){
                    if(err){
                        console.log("have error: " + err);
                        me.response.speak(err);
                        me.emit(':responseReady');
                        return;
                    }
                
                    console.log("Have cube data:");
                    console.log(JSON.stringify(cubeData));
                    
                    var metricValue = null;
                
                    var root = cubeData.result.data.root;
                    //console.log(root);
                    var child = getLastChild(root);
                    console.log("last child");
                    console.log(JSON.stringify(child));
                    var metrics = child.metrics;
                    var metricName = Object.keys(metrics)[0];
                    var metric = metrics[metricName];
                    metricValue = metric.fv;
                    
                    speechOutput = "Bultos Confirmados " + metricValue;
                    
                    console.log(speechOutput);

                    return speechOutput;
                });
            });
        });


        console.log("llegó al final");
        console.log(speechOutput);

        return handlerInput.responseBuilder
        .speak(speechOutput)
        .reprompt("¿Quieres saber otra información?")
        .getResponse();

    }
};




const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};


// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        HelloWorldIntentHandler,
        MetricaIntentHandler,
        MetricaPlantaIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addErrorHandlers(
        ErrorHandler,
    )
    .lambda();

    /*********************************************************************************************/
    /*********************************************************************************************/
    /*********************************************************************************************/
    /*********************************************************************************************/
    /*********************************************************************************************/
    /***************************************FUNCIONES DE MSTR*************************************/
    /*********************************************************************************************/
    /*********************************************************************************************/
    /*********************************************************************************************/
    /*********************************************************************************************/
    
    function getElementNameForDepth(depth, obj){
   
        var child = obj;
        for(var i = 0; i < depth+1; i++){
            child = getNextChild(child);
        }
        
    console.log(JSON.stringify(child));
    var element = child.element.name;
    console.log("element: " + element);
   
   return element;
}

function getChildForDepth(depth, obj){
   
        var child = obj;
        for(var i = 0; i < depth+1; i++){
            child = getNextChild(child);
        }
        
   return child;
}

function getNextChild(obj){
    var child = obj.children[0];
    console.log("DEPTH: " + child.depth);
    return obj.children[0];
}

function getLastChild(obj){
    if(obj.children != undefined){
        //console.log("child");
        return getLastChild(obj.children[0]);
    }
    else{
        return obj;
    }
    
}

function getRestSession(callback){
    var post_data = '{\"username\": \"'+config.username+'\",\"password\": \"'+config.password+'\"}';
    console.log("post_data: " + post_data);

  // An object of options to indicate where to post to
  var post_options = {
      host: config.webserver,
      port: '443',
      path: '/MicroStrategyLibrary/api/auth/login',
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
      }
  };
  
   var strPostOptions = JSON.stringify(post_options, null, 4); // (Optional) beautiful indented output.
   console.log("post_options: " + strPostOptions); // Logs output to dev tools console.
              
   var responseString = '';
    
  // Set up the request
  var post_req = https.request(post_options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
          responseString += chunk;
      });
      res.on('end', function () {
          
          console.log("res.statusCode: " + res.statusCode);
          
          if (res.statusCode == 204){
              console.log(res.headers);
              var cookie = res.headers['set-cookie'];
              var token = res.headers['x-mstr-authtoken'];
              return callback(null, token, cookie);
          }
          else{
              var str = JSON.stringify(res.headers, null, 4); // (Optional) beautiful indented output.
              console.log("header: " + str); // Logs output to dev tools console.
              
              var error = "The cloud server " + config.cloudEnvNumber + " is running, but there was an error creating a session. Please check your credentials and try again.";
                return callback(error, null, null);
          }
      });
  });

  // post the data
  post_req.write(post_data);
  post_req.end();
}

function getCubeDefinition(token,cookie,cubeID, callback){
    console.log("Get cube definition:");

    var projectID = config.projectID;
    var post_data = '';
    
     // An object of options to indicate where to post to
  var post_options = {
      host:config.webserver,
      port: '443',
      path: '/MicroStrategyLibrary/api/cubes/' + cubeID,
      method: 'GET',
      headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-MSTR-AuthToken':token,
          'X-MSTR-ProjectID':projectID,
          'cookie': cookie[0]
      }
  };
  
  //console.log(post_options);

    var responseString = '';
    
  // Set up the request
  var post_req = https.request(post_options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
          responseString += chunk;
      });
      res.on('end', function () {
          return callback(null, JSON.parse(responseString));
          
      });
  });

  // post the data
  post_req.write(post_data);
  post_req.end();

}

function getCubeData(token,cookie,cubeID, postData, callback){
    console.log("Get cube data:");

    var projectID = config.projectID;
    
    var path = '/MicroStrategyLibrary/api/cubes/' + cubeID + '/instances?limit=1000';
    console.log("path: " + path);
    
     // An object of options to indicate where to post to
  var post_options = {
      host:config.webserver,
      port: '443',
      path: path,
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-MSTR-AuthToken':token,
          'X-MSTR-ProjectID':projectID,
          'cookie': cookie[0]
      }
  };
  
  //console.log(post_options);

    var responseString = '';
    
  // Set up the request
  var post_req = https.request(post_options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
          responseString += chunk;
      });
      res.on('end', function () {
         // console.log(responseString);
          var responseObj = JSON.parse(responseString);
          var error = null;
          if(responseObj.message != undefined){
              console.log("ERROR");
              error = responseObj.message;
          }
          //console.log("should get error: " + error);
          return callback(error, responseObj);
          
      });
  });

  // post the data
  post_req.write(JSON.stringify(postData));
  post_req.end();

}

function formCubePostData(cubeDef, requiredAttributeNames, requiredMetricNames, filters){
    
    var postData = {"requestedObjects":{"attributes":[],"metrics":[]}};
    
    for(var i = 0; i < requiredAttributeNames.length; i++){
        var obj = requiredAttributeNames[i];
        var objID = getIDFromCubeDef(cubeDef, obj, 'attribute');
        console.log("Obj: " + obj + " ID: " + objID);
        
        postData.requestedObjects.attributes.push({'id':objID});
    }
    
    for(var i = 0; i < requiredMetricNames.length; i++){
        var obj = requiredMetricNames[i];
        var objID = getIDFromCubeDef(cubeDef, obj, 'metric');
        console.log("Obj: " + obj + " ID: " + objID);
        
        postData.requestedObjects.metrics.push({'id':objID});
    }
    
    //Form filter:
    var filter = {"operator":"And","operands":[]};
    
    for(var i = 0; i < filters.length; i++){
        var filterRequest = filters[i];
         
        if(filterRequest.type == 'attribute'){
            var objID = getIDFromCubeDef(cubeDef, filterRequest.name, filterRequest.type);
            var elementID = 'h' + filterRequest.element + ';' + objID;
            var component = {"operator":"In","operands":[{"type":"attribute","id":objID},{"type":"elements","elements":[{"id":elementID}]}]};
            
            filter.operands.push(component);
    
        }
        else{
            console.log("havent built this protoype to support metric filters");
        }
    }
    //console.log("filter");
    //console.log(JSON.stringify(filter));
    postData.viewFilter = filter;
    return postData;
}

function getIDFromCubeDef(cubeDef, name, type){
    
    if(type == 'attribute'){
        var cubeDefAttributes = cubeDef.result.definition.availableObjects.attributes;
        
        for(var i = 0; i < cubeDefAttributes.length; i++){
            var cubeDefObj = cubeDefAttributes[i];
            
            if(cubeDefObj.name == name){
                return cubeDefObj.id;
            }
        }
    }
    if(type == 'metric'){
        var cubeDefMetrics = cubeDef.result.definition.availableObjects.metrics;
        
        for(var i = 0; i < cubeDefMetrics.length; i++){
            var cubeDefObj = cubeDefMetrics[i];
            
            if(cubeDefObj.name == name){
                return cubeDefObj.id;
            }
        }
    }
    return null;
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
