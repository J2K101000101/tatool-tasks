'use strict';

//const { CustomPropertiesCollection } = require("survey-jquery");

//const { ConditionsParser } = require("survey-jquery");

/* global fabric */

tatool
  .controller('tatoolContinuousOrientationFeedbackCtrl', [ '$scope', 'service', 'executableUtils',
    function ($scope, service, executableUtils) {
      console.log('test');
    var canvas;
    var canvasElement;
   

    // Start execution
    $scope.start = function() {
      service.createStimulus();

      // prepare the canvas
      canvasElement = document.getElementById('canvas');
      canvasElement.width  = document.body.getBoundingClientRect().width;
      canvasElement.height = document.body.getBoundingClientRect().height;

      canvas = new fabric.Canvas('canvas');
      canvas.selection = false;
      canvas.backgroundColor = 'rgb(128,128,128)';
      canvas.defaultCursor = 'none';

      // logic to resize (not implemented yet)
      function reportWindowSize() {
        //canvas.setWidth( document.body.getBoundingClientRect().width );
        //canvas.setHeight( document.body.getBoundingClientRect().height );
        //canvas.calcOffset();
        //canvas.renderAll();
      }
      
      window.onresize = reportWindowSize;

      var text = new fabric.Text('+', { fontSize: 60, fill: 'white' });
      canvas.add(text);
      text.center();
      //text.setCoords();
      service.fixationTimer.start(showEncoding);
      };
   
    function showEncoding() {

      canvas.remove(...canvas.getObjects());
      // display stimuli
      var radius = 200;
      var n = service.trial.setSize;
      var x, y, angle;
      var canvasObject;

      // (x + r cos(2kπ/n), y + r sin(2kπ/n))
      // where n is the number of elements, and k is the "number" of the element you're currently positioning (between 1 and n inclusive)
      for (var i = 0; i < n; i++) {
        x = Math.round(canvas.width / 2 + radius * Math.cos((2 * i * Math.PI)/n));
        y = Math.round(canvas.height / 2 + radius * Math.sin((2 * i * Math.PI)/n));
        angle = service.stimuli[i].angle;

        canvasObject = new fabric.Triangle({
          width: 53//35
          , height: 98//60
          , fill: 'white'
          , left: x
          , top: y
          , selectable: false
          , angle: angle
          , hoverCursor: 'none'
          , originX: 'center'
          , originY: 'center'
          , centeredRotation: true 
        });
        canvas.add(canvasObject);  
      }

       var encoded = canvas.getObjects();
       console.log('encoded stage',encoded);
      service.startTime = executableUtils.getTiming();
      service.encodingTimer.start(timerUp);

    }
   
     
    // Called by timer when time elapsed
    function timerUp() {   
      canvas.remove(...canvas.getObjects());
      service.blankTimer.start(showProbe);
    }

    // Show probe item
    function showProbe() {
      console.log('start showProbe');
   
      canvas.remove(...canvas.getObjects());
      canvas.defaultCursor = 'pointer';

      // display probe
      var radius = 200;
      var n = service.trial.setSize;
      var x, y;
      var canvasObject;

      // (x + r cos(2kπ/n), y + r sin(2kπ/n))
      // where n is the number of elements, and k is the "number" of the element you're currently positioning (between 1 and n inclusive)
      for (var i = 0; i < n; i++) {
        x = Math.round(canvas.width / 2 + radius * Math.cos((2 * i * Math.PI)/n));
        y = Math.round(canvas.height / 2 + radius * Math.sin((2 * i * Math.PI)/n));

        canvasObject = new fabric.Triangle({
          width: 53//35
          , height: 98//60
          , fill: (service.trial.probeItem-1 == i) ? 'rgb(100,100,100)' : 'rgb(128,128,128)'
          , left: x
          , top: y
          , selectable: false
          , angle: executableUtils.getRandomInt(0,360)
          , hoverCursor: 'none'
          , originX: 'center'
          , originY: 'center'
          , centeredRotation: true 
        });
        canvas.add(canvasObject);
      }
      
    
      var probe = canvas.getObjects()[service.trial.probeItem-1];
      console.log(service.trial.probeItem-1);
      //console.log(canvas.getObjects());
      console.log('probe before mouse move',probe.angle);
      // mouse move and down logic

      
      var toCanvasPoint = function (canvas, absoluteX, absoluteY) {
        var offset = fabric.util.getElementOffset(canvas.lowerCanvasEl), localX = absoluteX - offset.left, localY = absoluteY - offset.top;
        return new fabric.Point(localX, localY);
      }
      
      var offsetToObject = function (object, point) {
        var offsetPoint = new fabric.Point(object.left, object.top);
        return point.subtract(offsetPoint);
      }

      var start, end;
      
      start = new fabric.Point(0, 0);
      console.log('to start mouse move & down');
      canvas.on('mouse:move', canvasMouseMove);
      console.log('mouse:move');
      canvas.on('mouse:down', canvasMouseDown);

      console.log(' after mouse down givenangle is :',service.trial.givenResponse);
      console.log('probe x&y', probe.left,probe.top);
      


        function canvasMouseMove(opts) {
        //console.log('opts',opts)
        end = offsetToObject(probe, toCanvasPoint(canvas, opts.e.clientX, opts.e.clientY));
          var deltaAngle = fabric.util.radiansToDegrees(Math.atan2(start.x,
            start.y) - Math.atan2(end.x, end.y)), oldAngle = probe.get('angle');
          var angle = oldAngle + deltaAngle;
          probe.set('angle', angle);
          //console.log('start and end inside:', end)
          start = end;
          canvas.renderAll();
    
      }


      function canvasMouseDown(e) {
        //canvas.off();
        service.endTime = executableUtils.getTiming();
        var angle = probe.get('angle');// new angle or just probe?
        console.log('probe.get after canvas.off:',angle)
        canvas.off('mouse:down', canvasMouseDown);
        canvas.off('mouse:move', canvasMouseMove);
        canvas.clear();
        service.feedbackTimer.start(function(){ return service.processResponse(probe.get('angle'), canvas); });
        
        console.log(' probe. get in the function:',probe.get('angle'));
        feedback(probe.left,probe.top,probe.get('angle') );
       console.log(' run feedback()');

      }
    
    }
   
    //feedback
    function feedback(X,Y,givenAngle){
        console.log('givenResponse',givenAngle);
        var currentAngle = null;
        var deviation = null;
      if (givenAngle < 0) {
        currentAngle = 360 + givenAngle;
      } else if (givenAngle > 360) {
        currentAngle = givenAngle - 360;
      } else {
        currentAngle = givenAngle;
      }
       console.log('currentAngle',currentAngle);
       console.log('probeAngle', service.trial.probeAngle);
      var delta = currentAngle - service.trial.probeAngle;
      console.log('delta',delta);
        // deviation positive, to the right;  deviation negative, to the left
        if (delta < -180){
          deviation = delta + 360; 
        } else if (delta > 180){
          deviation = delta - 360;
        }else{
          deviation = delta;
        }
      
      var deviationAbs = Math.abs(deviation);
console.log('deviation',deviation);
console.log('deviationAbs,deviationAbs');

     // canvas.remove(...canvas.getObjects());
   // display stimuli
    canvas.backgroundColor = 'rgb(128,128,128)';     
      var radius = 200;
      var n = service.trial.setSize;
      var x, y, angle;
      var canvasObject;

      // (x + r cos(2kπ/n), y + r sin(2kπ/n))
      // where n is the number of elements, and k is the "number" of the element you're currently positioning (between 1 and n inclusive)
      for (var i = 0; i < n; i++) {
        x = Math.round(canvas.width / 2 + radius * Math.cos((2 * i * Math.PI)/n));
        y = Math.round(canvas.height / 2 + radius * Math.sin((2 * i * Math.PI)/n));
        angle = service.stimuli[i].angle;

        canvasObject = new fabric.Triangle({
          width: 53//35
          , height: 98//60
          , fill: 'white'
          , left: x
          , top: y
          , selectable: false
          , angle: angle
          , hoverCursor: 'none'
          , originX: 'center'
          , originY: 'center'
          , centeredRotation: true 
        });
        canvas.add(canvasObject);  
      }

        
        if (deviationAbs < 15){
        var givenObject = new fabric.Triangle({
          width: 53//35
          , height: 98//60
          , fill: 'green'
          , left: X
          , top: Y
          , selectable: false
          , angle: givenAngle
          , hoverCursor: 'none'
          , originX: 'center'
          , originY: 'center'
          , centeredRotation: true 
        });
        canvas.add(givenObject);
        
       } else if (deviationAbs < 45 && deviationAbs > 15){
           var givenObject = new fabric.Triangle({
          width: 53//35
          , height: 98//60
          , fill: '#FFA500'
          , left: X
          , top: Y
          , selectable: false
          , angle: givenAngle
          , hoverCursor: 'none'
          , originX: 'center'
          , originY: 'center'
          , centeredRotation: true 
        });
        canvas.add(givenObject);
       }else{
           var givenObject = new fabric.Triangle({
          width: 53//35
          , height: 98//60
          , fill: 'red'
          , left: X
          , top: Y
          , selectable: false
          , angle: givenAngle
          , hoverCursor: 'none'
          , originX: 'center'
          , originY: 'center'
          , centeredRotation: true 
        });
        canvas.add(givenObject);
       }
       
       var text1 = new fabric.Text('Feedback:  ', { fontSize: 50, fill: 'white'});
      canvas.add(text1);
    

      /*
      var text1 = new fabric.Text('Deviation:  '+ Math.floor(deviationAbs) + '°', { fontSize: 20, fill: 'green', backgroundColor:'white'});
      canvas.add(text1);
      text1.center();
        */
      }
   
  
      
  }]);
