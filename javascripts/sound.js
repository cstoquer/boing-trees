
/**▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
 * @function module:loading.loadSound
 * @desc  load an sound file
 *
 * @param {String}   path - file path
 * @param {Function} cb   - asynchronous callback function
 */
function loadSound(path, cb) {
	var snd = new Audio();
	snd.preload = true;
	snd.loop = false;
	
	function onSoundLoad() {
		cb(null, snd);
		snd.removeEventListener('canplaythrough', onSoundLoad);
		snd.removeEventListener('error', onSoundError);
	}

	function onSoundError() {
		cb('snd:load');
		snd.removeEventListener('canplaythrough', onSoundLoad);
		snd.removeEventListener('error', onSoundError);
	}

	snd.addEventListener('canplaythrough', onSoundLoad);
	snd.addEventListener('error', onSoundError);
	snd.src = path;
	snd.load();
}

var audioCtx = new webkitAudioContext();

function playSoundWebkit(sound, vol, pan) { 
	if (!sound) return;

	var source = audioCtx.createBufferSource();
	var volume = audioCtx.createGainNode();
	var panner = audioCtx.createPanner();

	source.connect(panner);
	panner.connect(volume);
	volume.connect(audioCtx.destination);

	panner.coneOuterGain  = 0.5;
	panner.coneOuterAngle = 180;
	panner.coneInnerAngle = 0;

	panner.setPosition(pan, 0, -0.5);
	volume.gain.value = vol;
	source.buffer = sound;
	
	source.noteOn(0);
}

function playSoundAudio(sound, vol) {
	if (!sound) return;
	sound.volume = vol;
	sound.play();
}
