import style from './style.module.scss';
import { useRef, useMemo, useEffect, useCallback, useState } from 'preact/hooks';
import { useSpring, SpringValue, a } from 'react-spring';
//import Stats from 'stats.jsx'

import * as CHARACTER from './character.jsx'
import { shuffle } from '/lib/math';

import { EXT_meshopt_compression } from './ext_meshopt_compression.js';
import { useScript } from '/lib/hooks/index.jsx';
import { randomCharacterSettings, models } from '../../lib/generators/choices';
import {MeshoptDecoder} from './meshopt_decoder.js'; // imports MeshoptDecoder global

function findObject(scene, callback) {
  var result
  scene.traverse((node) => {
    if (callback(node) && !result) result = node;
  })
  return result
}

function morphScene(section, state, original = section.original) {
  const unionFrom = section.children.filter((a) => state.children.find((b) => a.name == b.name) && !a.name.includes('Character'));
  const unionTo = state.children.filter((a) => original.children.find((b) => a.name == b.name) && !a.name.includes('Character'));


  unionFrom.map((c, index) => {
    return morphObject(c, unionTo[index], false, (node, to) => {
      return;
      const animations = rendered.assets.animationsOfScenes.filter((a) => {
        return a.name.indexOf(to.name) == 0 && !(a.name.charAt(to.name.length) || '').match(/\d/);
      });
      if (node.animations) {
        var last = node.animations[0]
        node.animations.map((a) => {
          a.fadeOut(0.3)
        })
        node.animations = [];
      }
      animations.map((animation) => {
        const clip = rendered.mixer.clipAction(animation, node)
        clip.clampWhenFinished = true;
        if (!animation.name.includes('Loop'))
          clip.setLoop( THREE.LoopOnce )
        clip.reset()
        clip.play();
        clip.fadeIn(0.5)
        console.log(clip, 'launched')
        if (!node.animations) node.animations = []
        node.animations.push(clip) 
      })
    })
  })
}

function isCamera(n) {
  return n.isCamera// || n.name.includes('Camera')
}

function isLight(n) {
  return n.isLight// || n.name.includes('Light')
}

function isPartial(a) {
  return a.name.includes('Additive') || a.name.includes('Upper')
}
function initializeWorldLights(scene, rendered) {

  //renderer.toneMapping = THREE.ACESFilmicToneMapping
  rendered.renderer.gammaFactor = 2.2;
  //rendered.renderer.gammaOutput =  true;
  rendered.renderer.outputEncoding = THREE.sRGBEncoding 

  //scene.fog = new THREE.FogExp2( 0xefd1b5, 0.0175 );

  scene.fog = new THREE.FogExp2( 0xd3f0ef, 0.01 );
  // office fog
  //scene.fog = new THREE.FogExp2( 0xd3f0ef, 0.075 );
  rendered.renderer.shadowMap.enabled = true;
  rendered.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

  var hemiLight = new THREE.HemisphereLight(0xe1dbb8, 0x080820, 2);
  scene.add( hemiLight );

  var dirLight = new THREE.DirectionalLight( 0xffffff, .7);
  dirLight.position.set( -1, 1.25,  1);
  dirLight.position.multiplyScalar( 15);
  dirLight.name = "dirlight";
  dirLight.castShadow = false//true
  const d = 5;

  //dirLight.position.set(0,0,0)
  dirLight.shadow.near = 1
  dirLight.shadow.far = 10
  dirLight.shadow.bias = -0.0001
  dirLight.shadow.camera.left = - d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = - d;

  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  dirLight.shadow.radius = 1;
  
  rendered.light = dirLight
  //const cameraHelper = new THREE.CameraHelper(dirLight.shadow.camera);
  //scene.add(cameraHelper);

  //var helper = new THREE.DirectionalLightHelper( dirLight, 1, 0xff0000 );
  /*/
  rendered.lightTarget = new THREE.Object3D;
  rendered.lightTarget.position.set(0,0,-5);
  rendered.light.target = rendered.lightTarget
  rendered.camera.add(rendered.lightTarget); */
  scene.add(rendered.light)
  //scene.add( helper );
}

function initializeCharacterMaterials(character) {
  const b = new THREE.BoxGeometry(2,2.5,2,1);
  const mat = new THREE.MeshBasicMaterial({color: 0x00ff00});
  const m = new THREE.Mesh(b, mat)
  b.applyMatrix4( new THREE.Matrix4().makeTranslation(0,1.25,0) );
  b.frustumCulled = true
  mat.opacity = 0//.1
  mat.depthWrite = false
  mat.transparent = true
  m.name = character.children[0].name.replace('Character_', '')// + '_Box'
  character.traverse((n) => {
    n.frustumCulled = false
    n.castShadow = true
    n.receiveShadow = true
    if (n.material) {
      var original = n.material;
      n.material = new THREE.MeshToonMaterial
      n.material.copy(original)
      //s.castShadow = true
      n.material.metalness = 0.5;
      n.material.roughness = .9;
      n.material.flatShading = false;
      //n.material.emissive = 0xffffff;
    }
  })
  //character.rotation.z = - Math.PI / 2
  /*character.castShadow = true
  character.receiveShadow = true*/
  //m.rotation.x = Math.PI / 2
  m.add(character);
  return m
}

function initializeWorldMaterials(scene) {
  var materials = {};
  scene.traverse((s) => {
    if (s.material) {
      /*s.receiveShadow = true
      if (s.parent.name && s.parent.name.includes('SM'))
        s.castShadow = true*/
      var m = s.material
      if (s.material.name.includes('Skyline')) {
        var original = s.material;
        s.material = new THREE.MeshBasicMaterial({transparent: true, alphaMap: original.map, color: 0x79d0fd, opacity: 1})
        /*s.material.metalness = 0;
        s.material.roughness = 1;*/
        s.material.fog = false
        s.material.alphaTest = 0.01
        s.material.side = THREE.DoubleSide
        s.frustumCulled = false
        //s.material.emissive = new THREE.Color(0xffffff)
      } else if (s.material.name.includes('Sky')) {
        var original = s.material;
        s.material = new THREE.MeshBasicMaterial
        s.material.copy(original)
        s.material.metalness = 1;
        s.material.roughness = 3;
        s.material.depthWrite = false
        s.material.fog = false
      //} else if (s.name.includes('ceiling')) {
     //   s.visible = false
      } else {
        //if (materials[s.material.name])
        //  return materials[s.material.name];
        if (s.parent.name.includes('_DoubleSide')) {
          if (!s.material.double) {
            s.material.double = s.material.clone();
            s.material.double.side = THREE.DoubleSide
          }
          s.material = s.material.double;
        } else {
          s.material.side = THREE.FrontSide
        }
        s.material.metalness = 0;
        s.material.roughness = 1.1;
        /*var original = s.material;
        s.material = new THREE.MeshBasicMaterial
        s.material.copy(original)*/
        //s.material.metalness = .3;
        //s.material.roughness = .2;

      }
      //s.material.emissive = 0xffffff;
    }
  })
}

function initializeRenderer(rendered) {

  var renderer = new THREE.WebGLRenderer({
    autoClear: false,
    antialias:true, 
    physicallyCorrectLights: true
  });
  renderer.sortObjects = false
  renderer.physicallyCorrectLights = true
  renderer.shadowMap.enabled = false//true;
  renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
  renderer.shadowMap.type = THREE.VSMShadowMap; 

  return renderer
}

function initializeScenes(world, rendered) {
  var scene = new THREE.Scene();
  rendered.scene = scene

  world.scenes.map((child) => {
    world[child.name] = child
  })
  if (world.scenes.length == 1) {
    world.scenes = [];
  }

  const main = world.scenes.find((s) => s.name == 'World')
  world.scenes.map((s) => 
    s.traverse((n) => {
      n.children.sort((a, b) =>{
        if (a.name > b.name) {
          return 1;
        }
        if (a.name < b.name) {
          return -1;
        }
        return 0;
      })
    }))
  world.scenes.map((s) => {
    const placement = main.getObjectByName(s.name);
    if (placement && placement !== s) {
      const clone = s.clone(true)
      clone.placement = placement;
      clone.original = s;
      clone.quaternion.copy(placement.quaternion);
      clone.scale.copy(placement.scale);
      clone.position.copy(placement.position); 
      placement.parent.remove(placement)
      
      const toRemove = [];
      clone.traverse((n) => {
        if (n.isLight || n.isCamera || n.name.includes('Character')) {
          toRemove.push(n)
        }
      })
      toRemove.map((m) => m.parent.remove(m))

      main.add(clone);;
    }
  })
  main.traverse((n) => {
    if (isLight(n)) {
      n.visible = false
 //     n.parent.remove(n)
    }
  })

  scene.updateMatrixWorld(true)
  scene.traverse((n) => {
    if (n.name.includes('SCENE_')) {
      n.visible = false;
    }
  })

  rendered.scene.add(rendered.camera)
  rendered.scene.add( main );

  return main
}

function initializeCharacters(Assets, rendered) {
  Assets.characters = Assets.Characters.children.slice().map((character, index) => {
    CHARACTER.initializeCharacterModel(character)
    initializeCharacterMaterials(character)
    return character
  }).filter((c) => c.$skeleton);
}

function initializeAnimations(Assets, rendered) {

  Assets.animationsOfScenes = []
  Assets.animationsOfSkeletons = [];
  Assets.animationsOfMovingNpcs = [];
  Assets.animations.map((a) => {
    a.startTime = Math.min(...a.tracks.map((t) => t.times[0]))
    a.endTime = Math.max(...a.tracks.map((t) => t.times[t.times.length - 1]))
    a.name = a.name.replace(/\.\d+/g, '')
    if (a.name.includes('/')) {
//            a.tracks = a.tracks.filter((a) => !a.name.includes('ixamo'))
      if (a.name.includes('World')) {
        Assets.animationsOfMovingNpcs.push(a)
      } else {
        Assets.animationsOfScenes.push(a)
      }
    } else {
      Assets.animationsOfSkeletons.push(a)
    }
    return a
  });

  // calculate travel distance
  Assets.animationsOfMovingNpcs.map((a) => {
    const values = a.tracks.find((t) => t.name.includes('position')).values;
    a.distance = 0;
    a.initialDuration = a.duration;
    for (var i = 0; i < values.length - 3; i += 3) {
      a.distance += Math.sqrt(Math.pow(values[i] - values[i + 3], 2) + Math.pow(values[i + 1] - values[i + 4], 2) + Math.pow(values[i + 2] - values[i + 5], 2), 2);
    }
    if (a.name.includes('Walking')) {
      a.reversed = a.clone();
      for (var p in a) {
        if (a.reversed[p] == null) a.reversed[p] = a[p];
      }
      a.reversed.name += '/Reversed';
      const euler = new THREE.Euler;
      const quaternion = new THREE.Quaternion;
      a.reversed.tracks.map((t) => {
        if (t.name.includes('quaternion')) {
          for (var i = 0; i < t.values.length; i += 4) {
            quaternion.set(t.values[i + 0], t.values[i + 1], t.values[i + 2] ,t.values[i + 3])
            euler.setFromQuaternion(quaternion)
            euler.y += Math.PI
            quaternion.setFromEuler(euler)
            t.values[i] = quaternion.x
            t.values[i + 1] = quaternion.y
            t.values[i + 2] = quaternion.z
            t.values[i + 3] = quaternion.w
          }
          const copy = t.values.slice()
          var count = t.values.length / 4;
          for (var i = 0; i < count; i ++) {
            t.values[i * 4 + 0] = copy[(count - i - 1) * 4 + 0]
            t.values[i * 4 + 1] = copy[(count - i - 1) * 4 + 1]
            t.values[i * 4 + 2] = copy[(count - i - 1) * 4 + 2]
            t.values[i * 4 + 3] = copy[(count - i - 1) * 4 + 3]
          }
        } else {
          const copy = t.values.slice()
          var count = t.values.length / 3;
          for (var i = 0; i < count; i ++) {
            t.values[i * 3 + 0] = copy[(count - i - 1) * 3 + 0]
            t.values[i * 3 + 1] = copy[(count - i - 1) * 3 + 1]
            t.values[i * 3 + 2] = copy[(count - i - 1) * 3 + 2]
          }
        }
      })
    }
  })

  Assets.animationsOfStaticNpcs = Assets.scene.getObjectByName('Npcs').children.map((npc, index) => {
    const pose = npc.name.includes('SittingFloor') || npc.name.includes('Grounded') ? 'Grounded' :
                  npc.name.includes('Leaning') ? 'Leaning.Wall' :
                  npc.name.includes('Laying') ? 'Laying' :
                 npc.name.includes('Sitting') ? 'Sitting' : 
                 npc.name.includes('Walking') ? 'Walking' : 'Standing';
    // generate list of animations
    const poses = pose.split(/\//g).map((p) => {
      var modifiers = ['Texting', 'Calling', 'Idle', 'Impatient', 'Sad', 'Dancing', 'Disappointed', 'Sad', 'Jumping', 'Gaming'];
      if (!p.includes('Alone')) {
        modifiers.push('Talking', 'Yelling', 'Arguing', 'Thankful', 'Agreeing', 'Victory', 'Pointing', 'PointingBack', 'Laughing', 'Clapping', 'Asking')
      }
      return p + '|' + modifiers.map((m) => p + '.' + m).join('|')
    // and list of prescribed models
    }).concat(
      npc.name.split(/\|/g).filter((p) => models.includes(p))
    ).join('|');

    if (pose.includes('Walking')) {
      
      //debugger
    } else {
      return new THREE.AnimationClip('World/N' + index + '/' + poses, 1, [
        new THREE.QuaternionKeyframeTrack( '.quaternion', [ 0, 1 ], [ npc.quaternion.x, npc.quaternion.y, npc.quaternion.z, npc.quaternion.w, npc.quaternion.x, npc.quaternion.y, npc.quaternion.z, npc.quaternion.w ] ),
        new THREE.VectorKeyframeTrack( '.position', [ 0, 1 ], [ npc.position.x, npc.position.y, npc.position.z, npc.position.x, npc.position.y, npc.position.z ] )
      ])
    }
  }).filter(Boolean).map((a) => {
    a.startTime = 0;
    a.endTime = 10;
    a.static = true;
    return a
  })

  Assets.animationsOfAllNpcs = Assets.animationsOfMovingNpcs.concat(Assets.animationsOfStaticNpcs).map((a) => {
    a.position = new THREE.Vector3;
    a.tracks.map((t) => {
      if (t.name.includes('.position')) {
        const length = t.values.length;
        for (var i = 0; i < length; i += 3) {
          a.position.x  += t.values[i] / (length / 3);
          a.position.y  += t.values[i + 1] / (length / 3);
          a.position.z  += t.values[i + 2] / (length / 3);
        }
      }
    })
    return a;
  })

  
  Assets.tpose = Assets.Animations.children.find((c) => c.name == 'T-Pose');

}

function resize(rendered, width, height) {
  const {renderer, camera} = rendered;
  rendered.width = width;
  rendered.height = height;
  if (rendered.camera) {
    rendered.camera.aspect = width / height
    rendered.camera.updateProjectionMatrix();
  }
  renderer.setSize(width, height, true);
  //renderer.clear()
}


function playScene(sceneName, rendered, target, onFinish, animationDelay = 1.5, parameters) {
  if (!rendered.assets) return;
  
  if (rendered.schedule)
    rendered.schedule.map(clearTimeout)

  target.section = rendered.scene.getObjectByName(sceneName.split('-')[0])
  target.state = rendered.assets.scenes.find((s) => s.name == sceneName)
              || target.section.original;

  target.camera = findObject(target.state, (n) => isCamera(n));
  if (!target.camera) throw new Error(sceneName + ' does not have camera');

  target.state.position.copy(target.section.placement.position);
  target.state.quaternion.copy(target.section.placement.quaternion);
  target.state.scale.copy(target.section.placement.scale);
  target.state.updateMatrixWorld(true);
  target.camera.updateMatrixWorld(true);
  target.camera.world = target.camera.clone()
  target.camera.matrixWorld.decompose(
    target.camera.world.position,
    target.camera.world.quaternion,
    target.camera.world.scale
  )
  
  morphObject(rendered.camera, target.camera.world, true,)
  rendered.mixer.stopAllAction()


  const sceneActors = parameters.actors || [];
  const sceneNpcs = parameters.npcs || [];
  const npcs = sceneActors.map((c) => 
    c === 'character' 
      ? parameters.character
      : typeof c == 'string' 
        ? sceneNpcs[c] 
        : c);

  var cameraMotion
  var groups = rendered.assets.animationsOfScenes.reduce((groups, a) => {
    if (a.name.includes(target.state.name + '/') && a.name.match(/\/Character|\/C\d+/)) {
      var index = a.name.split('/')[1];
      if (!groups[index]) groups[index] = []
      groups[index].push(a);
    } else if (a.name.includes(target.state.name + '/Camera')) {
      cameraMotion = a;
    }
    return groups
  }, {});

  const allAnimations = Object.values(groups).flat();
  const lastAnimation = allAnimations
    .filter((a) => !a.static)
    .sort((a, b) => {
      return (b.endTime - a.endTime)
    })[0];
  const totalLength = Math.max(
    cameraMotion ? cameraMotion.endTime : 3, 
    lastAnimation ? lastAnimation.endTime : 3
  )
  allAnimations.forEach((a) => {
    if (a.static)
      a.endTime = totalLength;
  })

  rendered.assets.animationsOfAllNpcs.reduce((groups, a) => {
    if (a.position.distanceTo(target.section.position) < 20) {
      // prescribed models are always showing up
      if (a.name.split(/\|/g).some((bit) => models.includes(bit))) {
        groups[a.name] = [a]
      } else if (Math.random() < .3) {
        groups[a.name] = [a]
      } else if (a.reversed && Math.random() < .3) {
        groups[a.name] = [a.reversed]
      }
    }
    return groups
  }, groups)
  

  rendered.schedule = [];
  const characters = rendered.assets.characters;

  setTimeout(() => {
    if (onFinish) onFinish()
  }, totalLength * 1000 + 3000);

  (rendered.chars || []).map(CHARACTER.freeCharacterInstance)
  rendered.chars = [];
  var npcIndex = 0;
  Object.keys(groups).sort().forEach((key) => {
    var animations = groups[key];
    const prescribedModel = shuffle(key.split(/\|/g).filter((bit) => models.includes(bit)))[0];
    // Main character
    if ((key === 'Character1' || key === 'C1') && !sceneActors.includes('character')) {
      var settings = parameters.character;
      var identifier = 'character';
    // Specific actor model
    } else if (npcs[npcIndex] !== undefined) {
      var identifier = sceneActors[npcIndex] && sceneActors[npcIndex].name || sceneActors[npcIndex];
      var settings = npcs[npcIndex];
      npcIndex++;
    // Random characters 
    } else {
      var settings = randomCharacterSettings(undefined, prescribedModel ? [prescribedModel] : undefined);
      var identifier = npcIndex++;
    }
    if (!settings) return;

    const character = CHARACTER.allocateCharacterInstance(characters, settings)
    CHARACTER.customizeCharacterInstance(character, settings);

    rendered.chars.push(character);
    if (key.includes('World')) {
      rendered.scene.add(character)
    } else {
      target.section.add(character)
    }
    
    animations = animations.sort((a, b) => {
      return (a.startTime - b.startTime) || (b.endTime - a.endTime)
    }).map((a, index) => {
      const clip = rendered.mixer.clipAction(a, character);
      const bits = a.name.split('/')

      // scene has overriden character clips
      // this is pretty brittle as it overrides animations in order of appearance 
      if (parameters.clips && parameters.clips[identifier] && parameters.clips[identifier][index]) {
        var animationQuery = parameters.clips[identifier][index];
      } else {
        var animationQuery = bits[2].replace(/\.\d+/, '');
      }
      const animationNames = animationQuery.split(/\|/g)

      const clips = shuffle(
        rendered.assets.animationsOfSkeletons.filter((skeletonAnimation) => {
          return animationNames.some((animationClipName) => {
            return skeletonAnimation.name.includes(animationClipName + '.Male')
                          || skeletonAnimation.name.includes(animationClipName + '.Female')
                          || skeletonAnimation.name === animationClipName
                          || (animationClipName.includes('Walking') && skeletonAnimation.name.includes(animationClipName))
          })
        }))
      const animation = clips[0]
      if (!animation) throw new Error('Animation not found: ' + animationQuery)
      const characterAnimation = CHARACTER.getCharacterClip(character.original.children[0].$skeleton, rendered.assets.tpose.children[0], animation, {
        upperBody: bits.includes('Upper'),
        mirror: bits.includes('Right')
      })
      if (bits.includes('Additive')) {
        THREE.AnimationUtils.makeClipAdditive(characterAnimation)
      }
      const characterClip = rendered.mixer.clipAction(characterAnimation, character.owner);
      characterClip.setLoop(THREE.LoopRepeat)
      clip.setLoop(THREE.LoopOnce)

      if (a.distance) {
        clip.timeScale = ((a.initialDuration * (characterAnimation.name.includes('Running') ? 3.5 : animation.name.includes('Text') ? 1 : 2)) / a.distance)  // * (bits.includes('Running') ? 1.2 : 0.7)
      }

      return {
        ...a,
        clip,
        characterAnimation,
        characterClip
      }
    });

    
    animations.map((a, clipIndex) => {
      // schedule movement
      const { characterClip, clip } = a;

      const nextAnimation = !isPartial(a) && animations.find((n) => !isPartial(n) && n !== a && (n.endTime >= a.endTime))
      const previousAnimation = !isPartial(a) && animations.slice(0, clipIndex).find((n) => !isPartial(n) && a.startTime > n.endTime - 100)

      rendered.schedule.push(
        ...scheduleClip(a, clip, animationDelay, () => {
          if (!nextAnimation && a.distance) {

            clip.paused = false
            clip.halt(2);
          }
        }, undefined, totalLength),
        ...scheduleClip(a, characterClip, animationDelay, () => {
          if (a.endTime >= totalLength - .1) {
            characterClip.paused = false
            characterClip.halt(2);
          } else if (nextAnimation) {
            nextAnimation.characterClip.reset()
            nextAnimation.characterClip.play()
            characterClip.crossFadeTo(nextAnimation.characterClip, 0.4)
          } else if (isPartial(a)) {
            characterClip.paused = false
            characterClip.fadeOut(.3); 
          }
        }, previousAnimation && previousAnimation.characterClip, totalLength))
    })

  })


  morphScene(target.section, target.state);
  clearTimeout(target.section.hidingInterior);
  target.section.traverse((n) => {
    if (n.name.includes('SCENE_')) {
      n.visible = true;
    }
  })
  if (target.section !== target.oldSection && target.state !== target.oldState && target.oldState) {
    var oldSection = target.oldSection;
    oldSection.hidingInterior = setTimeout(() => {
      oldSection.traverse((n) => {
        if (n.name.includes('SCENE_')) {
          n.visible = false;
        }
      })
    }, 500);
    morphScene(target.oldSection, target.oldState);
  } 
  if (cameraMotion) {
    if (!cameraMotion.patched) {
      cameraMotion.patched = true;
      var qs = cameraMotion.tracks.find((a) => a.name.includes('quaternion'));
      var ps = cameraMotion.tracks.find((a) => a.name.includes('position'));
      var ss = cameraMotion.tracks.find((a) => a.name.includes('scale'));
      var q = new THREE.Quaternion;
      var qq = new THREE.Quaternion;
      var p = new THREE.Vector3;
      var s = new THREE.Vector3;
      for (var index = 0; index < qs.values.length / 4; index++) {
        q.set(qs.values[index * 4 + 0], qs.values[index * 4 + 1], qs.values[index * 4 + 2], qs.values[index * 4 + 3])
        q.multiplyQuaternions(q, target.camera.quaternion)
        qs.values[index * 4 + 0] = q.x
        qs.values[index * 4 + 1] = q.y
        qs.values[index * 4 + 2] = q.z
        qs.values[index * 4 + 3] = q.w
        p.set(ps.values[index * 3 + 0], ps.values[index * 3 + 1], ps.values[index * 3 + 2])
        p.add(target.section.placement.position)
        ps.values[index * 3 + 0] = p.x
        ps.values[index * 3 + 1] = p.y
        ps.values[index * 3 + 2] = p.z
        s.set(ss.values[index * 3 + 0], ss.values[index * 3 + 1], ss.values[index * 3 + 2])
      } 

    }
    const cameraClip = rendered.mixer.clipAction(cameraMotion, rendered.camera);
    cameraClip.setLoop(THREE.LoopOnce)
    rendered.schedule.push(...scheduleClip(cameraMotion, cameraClip, 2))
  }

  target.oldSection = target.section;
  target.oldState = target.state;

}


function scheduleClip(animation, clip, delay, callback, previousClip, totalLength = Infinity) {
  clip.clampWhenFinished = true
  //}
  if (animation.startTime < 0.1 && !isPartial(animation) && animation.name.match(/Clapping|Dancing|Jumping|Idle/)) {
    clip.time = Math.random() * 2
  } else if (animation.name.match(/Talking|Yelling/)) {
    clip.time = Math.random() * 4
  } else if (animation.name.match(/Walking/) && animation.name.match(/P\d/)) {
    clip.time = Math.random() * 4
  } else if (animation.name.match(/Running/)) {
    clip.time = Math.random() * 2
  }
  var timeScale = clip.timeScale || 1;;
  if (animation.startTime < 0.1 && !animation.name.includes('Camera') && !previousClip) {
    clip.timeScale = 0.0000000001
    clip.play()
  }

  return [
    setTimeout(() => {
      window.renderedFrame = true
      //clip.stopWarping()
      clip.timeScale = timeScale

      if (isCamera(clip._localRoot)) {
        for (var property in clip._localRoot.tweens) {
          clip._localRoot.tweens[property].stop()
        }
        delete clip._localRoot.tweens
      }

      var time = clip.time;
      clip.reset()
      clip.time = time;
      
      if (previousClip) {
        clip.play()
        clip.crossFadeFrom(previousClip, 0.3)
      } else {
        clip.play()
      }
      clip.clampWhenFinished = true

      if (isPartial(animation)) {
        clip.time = .3
        clip.fadeIn(.3)
      }
    },  animation.startTime * 1000 + delay * 1000),

    setTimeout(() => {
      clip.paused = true
      if (callback) callback()
    }, Math.min(totalLength, animation.endTime) * 1000 + delay * 1000) 

  ]
}

var configs = {
  cameraPosition: { tension: 210, friction: 40, precision: 0.0001 },
  cameraRotation: { tension: 60, friction: 15, precision: 0.0001 }
}

function tweenObject (from, object, prop, value){
  if (from.isCamera && object === 'rotation') {
    var c = configs.cameraRotation
  } else if (from.isCamera && object === 'position') {
    var c = configs.cameraPosition
  }
  const current = from[object][prop];
  if (current != value) {
    if (!from.tweens) from.tweens = {};
    if (!from.tweens[object + prop]) {
      from.tweens[object + prop] = new SpringValue({
        from: current,
        config: c,
        //config: {
          onChange: (v) => {
            if (prop === 'opacity') {
              var o = from[object]
              if (!from[object].cloned) {
                from[object] = from[object].clone();
                from[object].cloned = true;
              }
              from[object].transparent = true;
              //from[object].opacity = .5;
            } 
            window.renderedFrame = true;
            from.updateMatrixWorld()
            from[object][prop] = v
          } 
        //}
      });
    }
    from.tweens[object + prop].start({
      from: current,
      to: value
    });
  }
}

function morphObject (from, target, shallow, callback){
  if (from.name.includes('Character')) return;
  if (from.quaternion) {
    tweenObject(from, 'rotation', 'x', target.rotation.x);
    tweenObject(from, 'rotation', 'y', target.rotation.y);
    tweenObject(from, 'rotation', 'z', target.rotation.z);
    //tweenObject(from, 'rotation', 'w', target.rotation.w);
  }
  if (from.position) {// && (!from.animations || !from.animations.find((a) => a._propertyBindings.find((b) => b.binding.path.includes('position'))))) {
    tweenObject(from, 'position', 'x', target.position.x);
    tweenObject(from, 'position', 'y', target.position.y);
    tweenObject(from, 'position', 'z', target.position.z);
    //tweenObject(from, 'rotation', 'w', target.rotation.w);
  }
  if (from.scale) {//} && (!from.animations || !from.animations.find((a) => a._propertyBindings.find((b) => b.binding.path.includes('scale'))))) {
    
    tweenObject(from, 'scale', 'x', target.scale.x);
    tweenObject(from, 'scale', 'y', target.scale.y);
    tweenObject(from, 'scale', 'z', target.scale.z);
  }
  if (from.material) {
    const opacity = target.parent.userData.opacity != null ? target.parent.userData.opacity : target.userData.opacity;
    tweenObject(from, 'material', 'opacity', opacity != null ? opacity : from.material.opacity);
  }
  if (callback) {
    callback(from, target)
  }
  if (!shallow && !from.name.includes('Character') && !isCamera(from) && !isLight(from)) from.children.map((c, i) => {
    morphObject(c, target.children[i], null, callback)
  })
}

function initializeCanvas(rendered) {
  if (!document.contains(rendered.renderer.domElement)) {
    const wrapper = document.querySelector('.' + style.canvas);
    wrapper.appendChild(rendered.renderer.domElement)
  }

  resize(rendered, rendered.renderer.domElement.offsetWidth, rendered.renderer.domElement.offsetHeight)

}

if (!window.rendered)
  window.rendered = {};

var rendered = window.rendered;

export default function Canvas({state, params: { section, itemId, scene }, input: { onScene }, ui}) {
  const canvasRef = useRef();
  const target = useRef();
  const springs = useRef();
  const [status, setStatus] = useState(rendered.renderer ? 'ready' : 'loading')
  const sceneColor = useMemo(() => {
    return new SpringValue('#f4f9ff', {
      from: '#f4f9ff',
      onChange:(v) => {
        sceneColor.onChange(v)
      },
      config: {
        tension: 60, friction: 10
      }
    })
  }, [])

  useEffect(() => {

  }, [])

  useEffect(() => {
    const onResize = (e) => {
      if (rendered.renderer)
        resize(rendered, window.innerWidth - ( window.innerWidth >= 784 ? 64 : 0), rendered.renderer.domElement.parentNode.offsetHeight)
      window.renderedFrame = true
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [])

  window.onScene = onScene

  /*
  useEffect(() => {
    rendered.stats = new Stats();
    rendered.stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
    rendered.stats.dom.style.right = 0;
    rendered.stats.dom.style.left = 'auto';
 //   document.body.appendChild( rendered.stats.dom );
    return () => {
   //   rendered.stats.dom.remove()
    }
  }, []) */

  const render = useCallback(() => {

    if (!rendered.clock)
      rendered.clock = new THREE.Clock;;

    const delta = rendered.clock.getDelta(); // clock is an instance of THREE.Clock
    if (true) {
        
      if ( rendered.mixer ) {
        rendered.mixer.update( delta );
      }
      if ( rendered.mixer ) {
        for (var i = 0; i < rendered.mixer._actions.length; i++) {
          if (rendered.mixer._actions[i].isRunning()) {
            for (var property in rendered.mixer._bindingsByRootAndName) {
              window.renderedFrame = true;
              var clips = rendered.mixer._bindingsByRootAndName[property];
              Object.values(clips)[0].binding.rootNode.updateMatrixWorld()
            }
            break;
          }
        }
      }
    }
  
    if (window.renderedFrame) {
      //rendered.stats.begin();
      window.renderedFrame = false;
      if (rendered.sky) {
        rendered.sky.parent.rotation.y -= Math.PI / 5000
        rendered.sky.parent.updateMatrixWorld()
      }

      if (rendered.camera) {
        //rendered.renderer.clear()
        rendered.camera.updateMatrixWorld(true)
        /*
        rendered.lightTarget.updateMatrixWorld(true)
        rendered.lightTarget.getWorldPosition(rendered.light.position)
        rendered.light.position.y += 2
        rendered.light.position.x += .5
        rendered.light.position.z += 3
        rendered.light.updateMatrixWorld(true) */
        //rendered.lightTarget.updateMatrixWorld(true)
        //rendered.camera.zoom = 264 / rendered.height
        //rendered.camera.setViewOffset( rendered.width, rendered.height, 0, (rendered.height - 264) - , rendered.width, rendered.height );

        if (rendered.scene)
          rendered.renderer.render(rendered.scene, rendered.camera)
        //rendered.renderer.render(rendered.ui, rendered.camera)
      }

      //rendered.stats.end();
    }

    cancelAnimationFrame(rendered.frame);
    rendered.frame = requestAnimationFrame(render);
  }, [])


  const [scripts] = useScript([
    'https://cdn.jsdelivr.net/npm/three@0.122/build/three.js',
    // 122 version of gltf loader assigns nodes unique names which we don't want
    'https://cdn.jsdelivr.net/npm/three@0.118/examples/js/loaders/GLTFLoader.js',
  ], 'three');

  
  useEffect(() => {
    if (rendered.renderer) {
      window.renderedFrame = true;
      initializeCanvas(rendered);
    }
    if (!scripts.success || rendered.renderer) return;
    rendered.renderer = initializeRenderer(rendered)
    rendered.mixer = new THREE.AnimationMixer(scene)
    initializeCanvas(rendered)
    rendered.camera = new THREE.PerspectiveCamera(45, rendered.renderer.domElement.parentNode.offsetWidth / rendered.renderer.domElement.parentNode.offsetHeight, .1, 1000);;

    var loader = new THREE.GLTFLoader();
    loader.createUniqueName = () => {}
    loader.register(function (parser) { return new EXT_meshopt_compression(parser, MeshoptDecoder); });

    

    console.time('Load')
    // Load a glTF resource
    loader.load(
      import.meta.env.NODE_ENV == 'production' || import.meta.env.NODE_ENV == 'staging' ? '/assets/models/index.glb.gz' : '/assets/models/index.glb',
      function ( Assets ) {
        console.timeEnd('Load')

        const world = initializeScenes(Assets, rendered)
        initializeCharacters(Assets, rendered);
        initializeAnimations(Assets, rendered);
        initializeWorldMaterials(rendered.scene)
        initializeWorldLights(rendered.scene, rendered)

        window.scene = rendered.scene;
        rendered.assets = Assets;
        rendered.sky = findObject(rendered.scene, (p) => p.name.includes('Sky'))
        //rendered.sky.parent.scale.multiplyScalar(100)
        //rendered.sky.parent.updateMatrixWorld()
        //scene.autoUpdate = false;
        //scene.autoUpdate = true
        setTimeout(() => {
          setStatus('ready');
        }, 30)

      }
    );
  }, [scripts.success])

  useEffect(() => {
    if (status === 'ready' && scene.name && !ui.tooltip && (scene.character || scene.name == 'Start')) {
      playScene(scene.name, rendered, target, undefined, undefined, scene);


      sceneColor.onChange = ((v) => {
        rendered.renderer.domElement.parentNode.parentNode.style.background = v
        rendered.renderer.domElement.parentNode.firstChild.style.background = `linear-gradient(
          to bottom,
          transparent,
          ${v})`
      })
      sceneColor.start((() => {
        switch (scene.name.split('-')[0]) {
          case 'Park': case 'Hotdogs':
            return 'rgb(104,95,83)';
          case 'Office':
            return 'rgb(44,45,46)';
          case 'University':
            return 'rgb(105,104,96)';
          case 'Bank':
            return 'rgb(67,67,63)';
          case 'Burgers':
            return 'rgb(121,117,108)';
          case 'Dorm':
            if (scene.name == 'Dorm-Work')
              return 'rgb(66,41,34)';
            return 'rgb(86,86,82)';
          case 'Exchange':
            return 'rgb(125,127,123)';
          default:
            return 'rgb(44,45,46)';

            //case 'Park':
           //   return 'hsl(71, 31%, 40%)';
           // case 'Office':
            //  return 'hsl(210, 2%, 18%)';
            //default:
             // return 'hsl(210, 2%, 18%)';
        }
      })())

      if (!rendered.frame || window.renderedFrame) {
        if (!rendered.renderer.domElement.style.opacity) 
          rendered.renderer.domElement.style.opacity = 1;
        render()
      }
    }
  }, [scene.name || scene, status, !!ui.tooltip, scene.uid])


  return <div class={style.canvas}>
    <section class={`spinning-loader ${status}`} >
      <img src={new URL('../../../../../../assets/logo.svg', import.meta.url).href} />
    </section>
  </div>
} 