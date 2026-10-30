import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source=fs.readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
const sceneSource=source.slice(source.indexOf('class GameScene'),source.indexOf('const game = new Phaser.Game')).replaceAll('import.meta.env.BASE_URL', '"./"');
const state={status:'play',autoWave:true,running:true,wave:1,money:0};
const context=vm.createContext({Phaser:{Scene:class {}},state,WAVES:[[],[],[]],audio:{setWaveActive(){},blip(){}},addLog(){},renderHud(){}});
vm.runInContext(ts.transpileModule(sceneSource+'\nglobalThis.GameScene=GameScene;', {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,context);
const scene=new context.GameScene();
const timers=[];
scene.time={delayedCall(delay,callback){const timer={callback,removed:false,remove(){this.removed=true;}};timers.push(timer);return timer;}};
for(const method of ['spawn','updateEnemies','updateTowers','updateProjectiles','syncViews'])scene[method]=()=>{};
function finishWave(){scene.waveActive=true;scene.update(0,16);return timers.at(-1);}
let timer=finishWave();scene.toggleAutoWave();assert.equal(timer.removed,true);timer.callback();assert.equal(state.wave,1,'disabling auto must prevent pending launch');
state.autoWave=true;timer=finishWave();scene.startWave();assert.equal(timer.removed,true,'manual start cancels queued launch');
state.running=true;timer=finishWave();scene.clearAll();assert.equal(timer.removed,true,'reset cancels old-run timer');
console.log('PASS: queued auto waves cancel on toggle off, manual wave start and run reset.');
