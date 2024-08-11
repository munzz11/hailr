
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext = new AudioContext();

// Connect to ROSBridge server
var ros = new ROSLIB.Ros();

function connectRos() {
   ros.connect('ws://10.8.0.8:9003');
}

setTimeout(connectRos, 2000);

ros.on('connection', function() {
    console.log('Connected to websocket server.');
});

ros.on('error', function(error) {
    console.log('Error connecting to websocket server: ', error);
});

ros.on('close', function() {
    console.log('Connection to websocket server closed.');
});


document.addEventListener('DOMContentLoaded', function () {
  var volume = document.getElementById('volume-range');
  var pitch = document.getElementById('pitch-range');
  var selectedParameter = null;
  var channel = 16;
  const channelnum = document.getElementById('channelinput');

  // Button Click Event Handler for Horn Stop Service
  document.getElementById('stophorn').addEventListener('click', function () {
      // Create a ROS Service client
      var serviceClient = new ROSLIB.Service({
          ros: ros,
          name: '/garmin_cortex/horn_stop', 
          serviceType: 'std_srvs/Empty' 
      });

      // Create a Service Request
      var request = new ROSLIB.ServiceRequest({
          // Add any request parameters if required
      });

      // Call the ROS Service
      serviceClient.callService(request, function (response) {
          console.log('Stop horn request successful: ', response);
          // Handle the response as needed
      }, function (error) {
          console.error('Stop horn error:', error);
          // Handle any errors
      });
  });
  
  // Button Click event handler for Horn Start Services
  document.getElementById('horn-buttons').addEventListener('click', function (event) {
    // Check if the clicked element has the class 'horn'
    if (event.target.classList.contains('horn')) {
        // Get the data-message attribute of the clicked button
        const horn_type = Number(event.target.getAttribute('data-message'));
        console.log('Horn type:', horn_type);

        // Create a ROS Service client
        var serviceClient = new ROSLIB.Service({
            ros: ros,
            name: '/garmin_cortex/horn_start', // Replace with your ROS Service name
            serviceType: 'std_srvs/Empty' // Replace with your ROS Service type
        });

        // Create a Service Request
        var request = new ROSLIB.ServiceRequest({
            signal: horn_type // Add any request parameters if required
        });

        // Call the ROS Service
        serviceClient.callService(request, function (response) {
            console.log('Horn state request successful: ', response);
            // Handle the response as needed
        }, function (error) {
            console.error('Horn state request error: ', error);
            // Handle any errors
        });
    }

  });

    // Button Click Event Handler for VHF calling channel
    document.getElementById('setchannel').addEventListener('click', function () {
        // Create a ROS Service client
        var serviceClient = new ROSLIB.Service({
            ros: ros,
            name: '/garmin_cortex/set_vhf_calling_channel_id', 
            serviceType: 'garmin_cortex_msgs/SetVHFCallingChannelID' 
        });
        
        channel = Number(channelnum.value);

        console.log(channel);
        // Create a Service Request
        var request = new ROSLIB.ServiceRequest({
            channel_id: channel
        });

        // Call the ROS Service
        serviceClient.callService(request, function (response) {
            console.log('Set channel request successful: ', response);
            // Handle the response as needed
        }, function (error) {
            console.error('Set channel request error: ', error);
            // Handle any errors
        });


   });

     // Button Click Event Handler for VHF calling channel
    document.getElementById('vhftansmitbutton').addEventListener('click', function () {
        // Create a ROS Service client
        var serviceClient = new ROSLIB.Service({
            ros: ros,
            name: '/send_text_service/transmit_text',
            serviceType: 'marine_radio_msgs/TransmitText'
        });

	// Get input values
       var transmitchannel = Number(document.getElementById('vhfchannel').value);
       var transmitmessage = document.getElementById('vhfmessage').value;


        console.log('Transmitting');
	console.log(transmitchannel);
	console.log(transmitmessage);
	
        // Create a Service Request
        var request = new ROSLIB.ServiceRequest({
            channel_id: transmitchannel,
	    message: transmitmessage
        });

        // Call the ROS Service
        serviceClient.callService(request, function (response) {
            console.log('VHF transmit request successful:', response);
            // Handle the response as needed
        }, function (error) {
            console.error('VHF transmist request error:', error);
            // Handle any errors
        });


   });

// Slider event handler for changing volume
volume.addEventListener('input', function () {
    var sliderValue = Number(volume.value);
    console.log('Slider value:', sliderValue);

    // Create a ROS Service client
    var serviceClient = new ROSLIB.Service({
        ros: ros,
        name: '/garmin_cortex/set_hailer_valume', // Replace with your ROS Service name
        serviceType: 'garmin_cortex_msgs/SetHailerVolume' // Replace with your ROS Service type
    });

    // Create a Service Request
    var request = new ROSLIB.ServiceRequest({
        volume: sliderValue // Add any request parameters if required
    });

    // Call the ROS Service
    serviceClient.callService(request, function (response) {
        console.log('Hailer volume request successful:', response);
        // Handle the response as needed
    }, function (error) {
        console.error('Hailer volume request error', error);
        // Handle any errors
    });
});

function updatePitchValue(value) {
    document.getElementById('pitch-value').innerText = value;
}

// Slider event handler for changing pitch
pitch.addEventListener('input', function () {
    var sliderValue = Number(pitch.value);
    console.log('Slider value:', sliderValue);
    const pitchRange = document.getElementById('pitch-range');
    updatePitchValue(pitchRange.value);

    // Create a ROS Service client
    var serviceClient = new ROSLIB.Service({
        ros: ros,
        name: '/garmin_cortex/set_horn_frequency', // Replace with your ROS Service name
        serviceType: 'garmin_cortex_msgs/SetHornFrequency' // Replace with your ROS Service type
    });

    // Create a Service Request
    var request = new ROSLIB.ServiceRequest({
        frequency: sliderValue // Add any request parameters if required
    });

    // Call the ROS Service
    serviceClient.callService(request, function (response) {
        console.log('Horn pitch request successful', response);
        // Handle the response as needed
    }, function (error) {
        console.error('Horn pitch request error', error);
        // Handle any errors
    });
});

});



// Subscribe to the audio topic
var audioListener = new ROSLIB.Topic({
  ros: ros,
  name: '/garmin_cortex/audio',
  messageType: 'marine_radio_msgs/AudioDataStamped',
  reconnect_on_close: true
});


var audioQueue = []; // Queue to store audio data
var isPlaying = false; // Flag to check if audio is playing

function playAudio(audioData, audioParams) {
  // Convert the binary string to a Uint8Array
  var binaryString = atob(audioData); // Decode base64 if necessary
  var bytes = new Uint8Array(binaryString.length);
  for (var i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
  }

  // Create an Int16Array from the Uint8Array
  var buffer = new ArrayBuffer(bytes.length);
  var view = new DataView(buffer);
  for (var i = 0; i < bytes.length; i++) {
      view.setUint8(i, bytes[i]);
  }
  var audioArray = new Int16Array(buffer);

  // Add audio data to the queue
  audioQueue.push(audioArray);
  //console.log(audioArray);
  // Start playing if not already playing
  if (!isPlaying) {
    playFromQueue(audioParams);
  }
}

function playFromQueue(audioParams) {
  if (audioQueue.length === 0) {
    isPlaying = false;
    return;
  }

  // Combine all audio data in the queue
  var combinedLength = audioQueue.reduce((acc, val) => acc + val.length, 0);
  var combinedArray = new Int16Array(combinedLength);
  var offset = 0;
  while (audioQueue.length > 0) {
    var audioArray = audioQueue.shift();
    combinedArray.set(audioArray, offset);
    offset += audioArray.length;
  }

  // Create an AudioBuffer
  var audioBuffer = audioContext.createBuffer(1, combinedArray.length, audioParams.sampleRate);

  // Fill the buffer with the audio data
  var audioBufferData = audioBuffer.getChannelData(0);
  for (var i = 0; i < combinedArray.length; i++) {
      audioBufferData[i] = combinedArray[i] / 32768;  // Normalize to the range [-1, 1]
  }

  // Create a buffer source
  var source = audioContext.createBufferSource();
  source.buffer = audioBuffer;

  // Connect the source to the output
  source.connect(audioContext.destination);

  // Start playback
  source.start();

  // Set a flag to indicate audio is playing
  isPlaying = true;

  // Schedule the next playback
  source.onended = function() {
    playFromQueue(audioParams);
  };
}

// Button click event listener
document.getElementById('playButton').addEventListener('click', function() {
  // Subscribe to the audio topic when the button is clicked
  audioListener.subscribe(function(message) {

      // Extract audio data from the custom message structure
      var audioData = message.audio.audio.data;  // Raw audio data
      var audioParams = {
          sampleRate: 16000,
          sampleFormat: 's16le',  // 'S16LE' format is equivalent to 's16le' for AudioContext
          bitrate: 256000,
          codingFormat: 'pcm'
      };
      
      // Play audio
      playAudio(audioData, audioParams);
  });
});


// Unsubscribe when the page is closed or when needed
window.onunload = function() {
  audioListener.unsubscribe();
};
