'use strict';

RoomPosition.prototype.clearPosition = function(target) {
  let structures = this.lookFor('structure');
  for (let structureId in structures) {
    let structure = structures[structureId];
    if (structure.structureType === STRUCTURE_SPAWN) {
      let spawns = this.room.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_SPAWN]);
      if (spawns.length <= 1) {
        target.remove();
        return true;
      }
    }
    this.log('Destroying: ' + structure.structureType);
    structure.destroy();
  }
};

RoomPosition.prototype.getClosestSource = function() {
  let source = this.findClosestByRange(FIND_SOURCES_ACTIVE);
  if (source === null) {
    source = this.findClosestByRange(FIND_SOURCES);
  }
  return source;
};

RoomPosition.prototype.findInRangeStructures = function(objects, range, structureTypes) {
  return this.findInRange(objects, 1, {
    filter: function(object) {
      return structureTypes.indexOf(object.structureType) >= 0;
    }
  });
};

RoomPosition.prototype.findClosestStructure = function(structures, structureType) {
  return this.findClosestByPath(structures, {
    filter: function(object) {
      return object.structureType === structureType;
    }
  });
};

RoomPosition.prototype.getAdjacentPosition = function(direction) {
  var adjacentPos = [
    [0, 0],
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1]
  ];
  return new RoomPosition(this.x + adjacentPos[direction][0], this.y + adjacentPos[direction][1], this.roomName);
};

RoomPosition.prototype.checkForWall = function() {
  return this.lookFor(LOOK_TERRAIN)[0] === 'wall';
};

RoomPosition.prototype.checkForObstacleStructure = function() {
  return this.lookFor(LOOK_STRUCTURES).some(s => OBSTACLE_OBJECT_TYPES.includes(s.structureType));
};

RoomPosition.prototype.inPath = function() {
  let room = Game.rooms[this.roomName];
  for (let pathName in room.getMemoryPaths()) {
    let path = room.getMemoryPath(pathName);
    for (let pos of path) {
      if (this.isEqualTo(pos.x, pos.y)) {
        return true;
      }
    }
  }
  return false;
};

RoomPosition.prototype.inPositions = function() {
  let room = Game.rooms[this.roomName];

  if (!room.memory.position) {
    return false;
  }

  for (let creepId in room.memory.position.creep) {
    let pos = room.memory.position.creep[creepId];
    if (!pos) {
      // TODO introduce this.log()
      console.log('inPositions:', this.roomName, creepId);
      continue;
    }
    if (this.isEqualTo(pos.x, pos.y)) {
      return true;
    }
  }
  for (let structureId in room.memory.position.structure) {
    let poss = room.memory.position.structure[structureId];
    for (let pos of poss) {
      // TODO special case e.g. when powerSpawn can't be set on costmatrix.setup - need to be fixed there
      if (!pos) {
        continue;
      }
      if (this.isEqualTo(pos.x, pos.y)) {
        return true;
      }
    }
  }

  return false;
};

RoomPosition.prototype.isExit = function() {
  if (this.x <= 1 || this.x >= 48 || this.y <= 1 || this.y >= 48) {
    return true;
  }
  return false;
};

RoomPosition.prototype.isValid = function() {
  if (this.x < 0 || this.y < 0) {
    return false;
  }
  if (this.x > 49 || this.y > 49) {
    return false;
  }
  return true;
};

RoomPosition.prototype.validPosition = function() {
  if (this.isExit()) {
    return false;
  }
  if (this.checkForWall()) {
    return false;
  }
  if (this.inPositions()) {
    return false;
  }
  if (this.inPath()) {
    return false;
  }
  return true;
};

RoomPosition.prototype.buildRoomPosition = function(direction, distance) {
  if (distance > 1) {
    console.log('!!!! Distance > 1 not yet implemented');
  }
  return this.getAdjacentPosition((direction - 1) % 8 + 1);
};

RoomPosition.prototype.findNearPosition = function*() {
  let distanceMax = 1;
  for (let distance = 1; distance <= distanceMax; distance++) {
    for (let direction = 1; direction <= 8 * distance; direction++) {
      let posNew = this.buildRoomPosition(direction, distance);
      if (!posNew.validPosition()) {
        //        console.log(posNew + ' - invalid');
        continue;
      }
      // Single position or array
      // Array?, because path and structures are arrays?
      yield posNew;
    }
  }
};
