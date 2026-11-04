(function(){'use strict';
/** Offline ambient rain plus a soft, repeating felt-piano mystery motif. */
class CaseAudio{
 constructor(){this.context=null;this.master=null;this.nodes=[];this.enabled=false;this.volume=.35;this.timer=null;this.noteIndex=0;this.nextNote=0;
  document.addEventListener('case47pause',()=>{if(this.context)this.context.suspend();});
  document.addEventListener('visibilitychange',()=>{if(!this.context)return;if(document.hidden)this.context.suspend();else if(this.enabled)this.context.resume().catch(()=>{});});
 }
 async set(enabled,volume,profile='case47'){
  if(this.profile!==profile){this.profile=profile;this.noteIndex=0;this.score=null;
   if(this.context){clearInterval(this.timer);for(const node of this.nodes){try{node.stop();}catch(e){}}this.nodes=[];this.build();this.nextNote=this.context.currentTime+.08;}
  }
  this.enabled=enabled;this.volume=volume;if(!enabled){if(this.context)await this.context.suspend();return;}
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  if(!this.context){this.context=new AC();this.master=this.context.createGain();this.master.connect(this.context.destination);this.build();}
  this.master.gain.setTargetAtTime(volume*.53,this.context.currentTime,.15);
  if(!document.hidden){const resumed=this.context.state!=='running';await this.context.resume();if(resumed)this.nextNote=this.context.currentTime+.08;this.schedule();}
 }
 build(){const c=this.context;
  // Low rain with moving cutoff: a rain bed, no streaming or sample file.
  const buffer=c.createBuffer(1,c.sampleRate*5,c.sampleRate),out=buffer.getChannelData(0);
  let last=0;for(let i=0;i<out.length;i++){last=last*.94+(Math.random()*2-1)*.06;out[i]=last*.23;}
  const rain=c.createBufferSource(),low=c.createBiquadFilter(),rg=c.createGain();rain.buffer=buffer;rain.loop=true;
  low.type='lowpass';low.frequency.value=1450;rg.gain.value=.21;rain.connect(low);low.connect(rg);rg.connect(this.master);rain.start();this.nodes.push(rain);
  const sweep=c.createOscillator(),sweepGain=c.createGain();sweep.frequency.value=.07;sweepGain.gain.value=350;sweep.connect(sweepGain);sweepGain.connect(low.frequency);sweep.start();this.nodes.push(sweep);
  // Restrained sub drone supports the piano without masking dialogue text.
  (this.profile==='room-six'?[164.81,246.94]:[55,82.41]).forEach((hz,i)=>{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=hz;g.gain.value=this.profile==='room-six'?.003:i?.014:.023;o.connect(g);g.connect(this.master);o.start();this.nodes.push(o);});
  this.timer=setInterval(()=>this.schedule(),350);
 }
 pianoNote(hz,time){const c=this.context;
  [1,2,3].forEach((multiple,i)=>{const osc=c.createOscillator(),g=c.createGain(),filter=c.createBiquadFilter();
   osc.type=i?'sine':'triangle';osc.frequency.setValueAtTime(hz*multiple,time);filter.type='lowpass';filter.frequency.value=i?1050:1600;
   g.gain.setValueAtTime(.0001,time);g.gain.exponentialRampToValueAtTime((i===0?.10:i===1?.034:.008),time+.025);
   if(this.profile==='room-six')g.gain.setValueAtTime(i===0?.045:i===1?.012:.003,time+.025);
   g.gain.exponentialRampToValueAtTime(.0001,time+(i===0?3.5:1.7));osc.connect(filter);filter.connect(g);g.connect(this.master);
   osc.start(time);osc.stop(time+3.6);
  });
 }
 schedule(){const c=this.context;if(!this.enabled||!c||c.state!=='running')return;
  // A minor / suspended colour, slowly paced; silence is part of the motif.
  const phrase=this.profile==='room-six'?this.longScore():[220,261.63,329.63,null,293.66,246.94,220,null,196,246.94,293.66,null,261.63,220,164.81,null];
  if(this.nextNote<c.currentTime)this.nextNote=c.currentTime+.06;
  while(this.nextNote<c.currentTime+.8){const i=this.noteIndex++,hz=phrase[i%phrase.length];if(hz)this.pianoNote(hz,this.nextNote);this.nextNote+=this.profile==='room-six'?(i%7===6?2.8:1.65):.94;}
 }
 longScore(){
  // Original offline score: 384 events, roughly 12 minutes before repeating.
  // Evolving consonant voicings and rests, with no external samples or short loop.
  if(this.score)return this.score;
  const chords=[[164.81,246.94,329.63,369.99,493.88],[146.83,220,293.66,369.99,440],[130.81,196,261.63,329.63,392],[164.81,246.94,311.13,369.99,493.88]];
  let seed=4706,last=-1;this.score=[];
  for(let i=0;i<384;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const chord=chords[Math.floor(i/32)%4];let n=(seed>>>8)%chord.length;if(n===last)n=(n+1)%chord.length;last=n;this.score.push(i%8===7||seed%9<2?null:chord[n]);}
  return this.score;
 }
 tick(){if(!this.enabled||!this.context||this.context.state!=='running')return;const c=this.context,o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(520,c.currentTime);o.frequency.exponentialRampToValueAtTime(260,c.currentTime+.09);g.gain.setValueAtTime(.06,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.12);o.connect(g);g.connect(this.master);o.start();o.stop(c.currentTime+.13);}
 press(){if(!this.enabled||!this.context||this.context.state!=='running')return;const c=this.context,t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.setValueAtTime(310,t);o.frequency.exponentialRampToValueAtTime(230,t+.055);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.018,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+.075);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+.08);}
}
window.CaseAudio=CaseAudio;
})();
