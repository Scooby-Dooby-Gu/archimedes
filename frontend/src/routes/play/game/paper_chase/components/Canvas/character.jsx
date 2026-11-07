
export function initializeCharacterModel(character) {
  character.traverse((n) => {
    if (n.skeleton) {
      character.position.set(0,0,0)
      character.$original = cloneSkeleton(n.skeleton)
      character.$skeleton = cloneSkeleton(n.skeleton)
    }
  })
  return character
}
function adaptClip(animation, options) {
  if (options && options.upperBody) {
    const clip = {...animation}
    clip.tracks = clip.tracks.filter((t) => !t.name.match(/Hip|Toe|Spine|Leg|Foot/i))
    return clip
  }
  if (false && options && options.mirror) {
    const clip = {...animation}
    clip.tracks = clip.tracks
    .map((t) => {
      if (t.name.includes('Left') || t.name.includes('Right')) {
        if (t.name.includes('Right')) {
          t.name = t.name.replace('Right', 'Left')
        } else {
          t.name = t.name.replace('Left', 'Right')
        }
      } else {
        if (t.name.includes('quaternion')) {
          for (var i = 0; i < t.values.length; i += 4) {
            t.values[i] *= -1
          }
        }
      }
      return t
    })
    return clip
  }
  return animation;
}


export function getCharacterClip(characterSkeleton, reference, animation, options) {

  const names = {}
  options = { hip: 'mixamorigHips', names, fps: 24, ...options }
  
  const referenceSkeleton = createSkeletonFromObject(reference);
  referenceSkeleton.bones.forEach((b) => names[b.name] = b.name)
  referenceSkeleton.bones[0].updateMatrixWorld(true);
  
  const clonedSkeleton = cloneSkeleton(characterSkeleton)
  const retargeted = animation.clone(true)
  retargeted.tracks = retargeted.tracks.filter((t) => {
    return t.name.includes('quaternion') || (t.name.includes('Hips') && t.name.includes('position'))
  })
  
  //retargetClip(clonedSkeleton, referenceSkeleton, animation, options);
  
  const normalized = normalizeClip(cloneSkeleton(characterSkeleton), referenceSkeleton, retargeted, options);
  return adaptClip(normalized, options)
}

// make character touch the ground
export function normalizeClip(characterSkeleton, referenceSkeleton, animation, options) {
  if (animation.name.includes('Sitting')) {
    const hipsPositionTrack = animation.tracks.find((t) => t.name == 'mixamorigHips.position')
    for (var i = 0; i < hipsPositionTrack.values.length; i+= 3) {
      hipsPositionTrack.values[i + 2] -= 0.08
    }
  }
  return animation;
}

export function createSkeletonFromObject(object) {
  const bones = []
  const clone = object.clone(true)

  clone.traverse((b) => {
    b.isBone = true;
    bones.push(b)
  })
  
  const skeleton = new THREE.Skeleton(bones)
  return skeleton
}

export function cloneSkeleton(skeleton) {

  return createSkeletonFromObject(skeleton.bones[0])

}


export function clone ( source ) {

  var sourceLookup = new Map();
  var cloneLookup = new Map();

  var clone = source.clone();

  parallelTraverse( source, clone, function ( sourceNode, clonedNode ) {

    sourceLookup.set( clonedNode, sourceNode );
    cloneLookup.set( sourceNode, clonedNode );

  } );

  clone.traverse( function ( node ) {

    if ( ! node.isSkinnedMesh ) return;

    var clonedMesh = node;
    var sourceMesh = sourceLookup.get( node );
    var sourceBones = sourceMesh.skeleton.bones;

    clonedMesh.skeleton = sourceMesh.skeleton.clone();
    clonedMesh.bindMatrix.copy( sourceMesh.bindMatrix );

    clonedMesh.skeleton.bones = sourceBones.map( function ( bone ) {

      return cloneLookup.get( bone );

    } );

    clonedMesh.bind( clonedMesh.skeleton, clonedMesh.bindMatrix );

  } );

  return clone;

}

function parallelTraverse( a, b, callback ) {

	callback( a, b );

	for ( var i = 0; i < a.children.length; i ++ ) {

		parallelTraverse( a.children[ i ], b.children[ i ], callback );

	}

}


export function allocateCharacterInstance(characters, params = {}) {
  const model = characters.find((ch) => ch.parent.name == params.model)
  if (!model) throw new Error('Can not find character ' + params.model);
  const original = model.parent;
  if (!original.instances) original.instances = [];
  var character = original.instances.pop();
  if (!character) {
    character = clone(original);
    character.traverse((n) => {
      if (n.geometry)
        n.geometry = n.geometry.clone()
      if (n.skeleton) {
        character.owner = n;
      }
    })
    character.original = original;
  }
  return character;
}

export function freeCharacterInstance(character) {
  character.parent.remove(character)
  character.original.instances.push(character)
}

export function customizeCharacterInstance(character, params = {}) {
  character.children[0].traverse((n) => {
    if (n.geometry) {
      if (!n.geometry.originalUV) 
        n.geometry.originalUV = n.geometry.attributes.uv.array.slice()
      const uvs = n.geometry.attributes.uv
      uvs.array = n.geometry.originalUV.slice()
      const count = n.geometry.attributes.uv.count;
      var scaleX = n.material.map.repeat.x
      var scaleY = n.material.map.repeat.y
      for (var i = 0; i < count; i++) {
        var x = uvs.getX(i) * scaleX * 1024;
        var y = uvs.getY(i) * scaleY * 1024;
        // facial hair
        //if (y > 846 && y < 865 && x >= 0 && x <= 42) {
        //  uvs.setY(i, (y - 20) / 1024 / scaleY)
        //  uvs.setX(i, (128 + x + shift * 64) / 1024 / scaleX)
        //} else 
        // skin color
        if (y > 800 && y < 865 && x >= 0 && x <= 42) {
          uvs.setX(i, (x + (params.skin || 0) * 128) / 1024 / scaleX)
          uvs.setY(i, Math.max(0, y - 802) / 1024 / scaleY)
        // clothing
        } else if (y > 800 && y < 1003 && x >= 0 && x <= 130) {
          uvs.setX(i, (x + (params.palette || 0) * 128) / 1024 / scaleX)
          uvs.setY(i, Math.max(0, y - 802) / 1024 / scaleY)
        }
      }
      n.geometry.attributes.uv.needsUpdate = true;
    }
  })
  return character
}