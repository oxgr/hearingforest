/**
 * This script mainly uses p5.js for the canvas UI for online submissions to Voice Forest by Rafael Lozano-Hemmer.
 * A <Model> object hosts global variables to make globals explicitly defined.
 * Since this js file is of type="module", p5's setup() and draw() functions are assigned to the global namespace via window.
 * 
 * @author Faadhi Fauzi <faadhi@antimodular.com>
 * Antimodular Research
 * August 2022
 */

import { Button, ProgressBar } from './components.js';

const model = {};

model.cnv = {};

window.setup = () => {
    
    console.log( 'Running setup()... ')

    model.origin = new URL( window.location.href ).origin;
    console.log( `URL origin: ${model.origin}`)
    
    model.colors = {
        default: '#101010',
        white: '#FFFFFF',
        disabled: '#AAAAAA',
        record: '#CC0000',
        play: '#33CC33'
    }
    
    model.html = ( ( document ) => {
        
        const form = document.querySelector( '#input' );
        const submitted = document.getElementById( 'submitted' );
    
        const name = form[ 0 ];
        const email = form[ 1 ];
        const confirmation = document.querySelector( '#checkmark' );

        const submitButton = form[ form.length - 1 ];
        // const submitButton = document.querySelector( '#btn-submit' );
    
        const canvasContainer = document.querySelector( '#canvasContainer' );
        
        const log = document.querySelector( '#log' );

        const removeForm = () => {
            form.remove();
            submitted.hidden = false;
        }
    
        return {
            formElement: form,
            form: {
                name: name,
                email: email,
                confirmation: confirmation,
                submitButton: submitButton,
            },
            canvasContainer: canvasContainer,
            log: log,
            removeForm: removeForm
        }
    
    })( document )
    
    console.log( model.html );
    
    model.html.form.submitButton.onclick = submitButtonClicked;
    model.html.canvasContainer.onclick = canvasClicked;
    
    model.cnv = createCanvas( 400, 400 );
    model.cnv.parent( model.html.canvasContainer );
        
    (()=> { 
        const { width, height } = model.html.canvasContainer.getBoundingClientRect();

        // Container height is limited base on viewport height, so set it to maximum square aspect ratio.
        resizeCanvas( width, Math.min( width, height ) );
    })()

    // Progress bar
    model.progressBar = ( ( canvasWidth, canvasHeight ) => {

        return new ProgressBar(
            canvasWidth * 0.1,
            canvasHeight * 0.1,
            canvasWidth * 0.8,
            canvasHeight * 0.3
        );

    })( width, height )
    
    model.buttons = ( ( canvasWidth, canvasHeight ) => {

        const middleX = canvasWidth * 0.5;
        const buttonHeight = canvasHeight * 0.7;
        const buttonSize = Math.min( canvasWidth * 0.3, canvasHeight * 0.3 );
        const buttonSpacing = buttonSize * 0.6;

        // Record button
        const record = new Button(
            middleX - buttonSpacing,
            buttonHeight,
            buttonSize
        );
        record.name = 'record';
        record.iconColorActive = model.colors.record;
        record.drawIcon = ( x, y, size, color ) => {
            push();
            noStroke();
            fill( color );
            circle( x, y, size );
            pop();
        }

        // Play button 
        const play = new Button(
            middleX + buttonSpacing,
            buttonHeight,
            buttonSize
        )
        play.name = 'play';
        play.iconColorInactive = model.colors.disabled;
        play.drawIcon = ( x, y, size, color, active ) => {
            push();
            noStroke();
            fill( color );

            if ( !active ) {
                // Play icon
                const triSize = size * 0.4;
                translate( size * 0.1, 0 )
                triangle( 
                    x - triSize,
                    y - triSize,
                    x + triSize,
                    y,
                    x - triSize,
                    y + triSize
                )   
            } else {
                // Pause icon
                rectMode( CENTER )
                const dist = size * 0.2;
                const w = size * 0.2;
                const h = size * 0.7;
                rect( x - dist, y, w, h );
                rect( x + dist, y, w, h );
            }
            pop();
        }

        // Record button
        const reset = new Button(
            middleX - buttonSpacing,
            buttonHeight,
            buttonSize
        );
        reset.name = 'reset';
        reset.drawIcon = ( x, y, size, color ) => {
            push();
            noStroke();
            fill( color );
            rectMode( CENTER );
            const rectSize = size * 0.8;
            rect( x, y, rectSize, rectSize );
            pop();
        }

        // Array of all buttons.
        const all = [ record, play ];

        return {
            record: record,
            play: play,
            reset: reset,
            all: all,
            clicked: {}
        }

    })( width, height )

    model.audio = ( () => {

        const mic = new p5.AudioIn();
        mic.start();

        const recorder = new p5.SoundRecorder();
        recorder.setInput( mic );

        const soundFile = new p5.SoundFile();

        const analyzer = new p5.Amplitude();
        analyzer.setInput( mic );
        analyzer.toggleNormalize( true );
        analyzer.smooth( 0.5 );

        let startTime = 0,
            currentTime = 0,
            totalTime = 0;

        let oldRMS = 0;

        return {
            mic: mic,
            recorder: recorder,
            soundFile: soundFile,
            analyzer: analyzer,
            startTime: startTime,
            currentTime: currentTime,
            totalTime: totalTime,
            oldRMS: oldRMS
        }

    } )()

    // model.progressBar.drawBorder();
    model.buttons.all.forEach( b => b.draw() );
    model.progressBar.drawTotalWave();

    model.alertRecord = false;
    model.alertColor = model.colors.record;

}

window.draw = () => {

    if ( model.buttons.clicked && model.buttons.clicked.name ) {

        model.buttons.all.forEach( e => { if ( e.name != model.buttons.clicked.name ) e.active = false } );
        
        switch ( model.buttons.clicked.name ) {

            case 'record':
                console.log( 'Record button clicked!')

                if ( !model.audio.mic.enabled ) {
                    console.log( 'Mic is disabled!' );
                    break;
                }

                model.buttons.record.toggle();

                if ( model.buttons.record.active ) {

                    model.audio.recorder.record( model.audio.soundFile );
                    model.audio.startTime = Date.now();
                    model.audio.currentTime = 0;
                    model.audio.totalTime = 0;
                    model.progressBar.reset();

                } else {

                    model.audio.recorder.stop();
                    model.audio.totalTime = Date.now() - model.audio.startTime;

                    model.buttons.play.iconColorInactive = model.colors.white;

                }

                break;

            case 'play':
                console.log( 'Play button clicked!' );

                if ( !model.audio.soundFile.isLoaded() ) {
                    console.log( 'Nothing is recorded.')
                    break;
                }

                model.buttons.play.toggle();

                if ( model.buttons.play.active ) {
                    
                    console.log( 'Playing soundFile...' );
                    console.log( { soundFile: model.audio.soundFile } );
                    model.audio.soundFile.play();
                    model.audio.soundFile.onended( () => {
                        model.buttons.play.toggle();
                        model.buttons.play.draw();
                    })
                    
                } else {
                    // console.log( 'Tried to play, but an audio file is currently playing.' );
                    model.audio.soundFile.stop();
                    model.buttons.play.toggle();
                    model.buttons.play.draw();
                    break;
                }


                break;
                
            case 'reset':
                console.log( 'Reset button clicked!' );
                    
                break;

        }

        model.buttons.clicked = {};
        
    }
    
    model.buttons.all.forEach( b => b.draw() );
    
    if ( model.buttons.record.active ) {

        // const now = ( Date.now() % 1000 ) * 0.001;

        // const now = ( frameCount % 60 ) / 60;
        // const normSin = sin( now );
        // const oscillatingSize = normSin * model.buttons.record.active.size;

        // model.buttons.record.iconSize = oscillatingSize;

        // model.buttons.record.draw();

        const rms = model.audio.analyzer.getLevel();
        // model.html.log.innerHTML = 'RMS: ' + rms;

        model.audio.currentTime = Date.now() - model.audio.startTime;
        
        // model.progressBar.drawWave( progress, rms );
        model.progressBar.addToWave( rms );
        model.progressBar.drawTotalWave(  );
        
        // // Normalised value between 0 - 60 seconds.
        // const progress = model.audio.currentTime / 60000;
        // model.progressBar.drawTotalWave( progress );

    }

    if ( model.buttons.play.active ) {

        const progress = model.audio.soundFile.currentTime() / model.audio.soundFile.duration();
        model.progressBar.drawTotalWave( progress );

    }

    if ( model.alertRecord == true ) {
        model.alertColor = lerpColor( model.alertColor, color( model.colors.white ), 0.03 );
        model.buttons.record.iconColorInactive = model.alertColor;
        model.buttons.record.draw();

    }


}

function canvasClicked( event ) {

    event.preventDefault();

    userStartAudio();

    model.buttons.clicked = model.buttons.all.find( ( button ) => button.clicked( mouseX, mouseY ) );

} 

async function submitButtonClicked( e ) {

    console.log( 'Submit button clicked!' );

    if ( !model.audio.soundFile.isLoaded() ) {
        console.log( 'Nothing is recorded.');
        model.alertRecord = true;
        model.alertColor = color( model.colors.record );
        return;
    }

    if ( !model.html.form.confirmation.checked ) {
        model.html.form.confirmation.parentElement.style.border = '2px solid #CC0000';
        return;
    }

    // MP3 encoding with lamejs
    const float32Buffer = model.audio.soundFile.buffer.getChannelData( 0 );
    const int16Buffer = float32ToInt16( float32Buffer );
    const mp3Data = encodeMono( int16Buffer );
        
    // Consolidating packet for sending.
    const packet = {
        name: model.html.form.name.value,
        email: model.html.form.email.value,
        input: mp3Data,
    }

    console.log( 'Sending packet...' );
    console.log( { packet: packet } );
    
    const response = await fetch( model.origin + '/voiceForest/input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify( packet ),
    })

    try {
        const data = await response.json();
        console.log('Success:', data);
        if ( data.response == 'ok' ) {
            model.html.removeForm();
        }

    } catch( e ) {
        console.error('Error:', e);
    }

    // Converts Float32Array to Int16Array and retains value within range.
    function float32ToInt16( float32Buffer ) {

        const int16Buffer = new Int16Array( float32Buffer.length );
        for (let i = 0, lenFloat = float32Buffer.length; i < lenFloat; i++) {
            if (float32Buffer[i] < 0) {
                int16Buffer[i] = 0x8000 * float32Buffer[i];
            } else {
                int16Buffer[i] = 0x7FFF * float32Buffer[i];
            }
        }

        return int16Buffer;

    }

    // Receives a Int16Array and returns an Int8Array with MP3-encoded data.
    function encodeMono( samples ) {

        const channels = 1; //1 for mono or 2 for stereo
        const sampleRate = 44100; //44.1khz (normal mp3 samplerate)
        const kbps = 128; //encode 128kbps mp3
        const mp3encoder = new lamejs.Mp3Encoder( channels, sampleRate, kbps );
        const buffers = [];
        const sampleBlockSize = 1152; //can be anything but make it a multiple of 576 to make encoders life easier
        let length = 0;

        for (var i = 0; i < samples.length; i += sampleBlockSize) {

            const sampleChunk = samples.subarray( i, i + sampleBlockSize );
            const mp3buf = mp3encoder.encodeBuffer( sampleChunk );
            if (mp3buf.length > 0) {
                length += mp3buf.length;
                buffers.push( mp3buf );
            }

        }

        const ending = mp3encoder.flush();
        if( ending.length > 0 ){
            length += ending.length;
            buffers.push( ending );
        }

        const flatBuffer = [];

        buffers.forEach( arr => arr.forEach( val => flatBuffer.push( val )))

        const mp3data = Int8Array.from( flatBuffer );

        return mp3data;

    }

}

