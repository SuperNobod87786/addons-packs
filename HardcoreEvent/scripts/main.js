import { world, system, GameMode} from "@minecraft/server";


world.afterEvents.entityDie.subscribe((dieEvent) => {
    const deadPlayer = dieEvent.deadEntity;
    if (!deadPlayer.isValid) { return }
    if (deadPlayer.getDynamicProperty("isHardcore")) {
        deadPlayer.setGameMode(GameMode.Spectator);
    }
}, { entityTypes: ["minecraft:player"] });




const threeHourPlayers = new Set();

world.afterEvents.playerJoin.subscribe((joinEvent) => {
    const joinedPlayer = world.getEntity(joinEvent.playerId);
    if (joinedPlayer === undefined || !joinedPlayer.isValid) { return }
    if (joinedPlayer.getDynamicProperty("isHardcore")) {
        return
    } else if (joinedPlayer.getDynamicProperty("isHardcore") === undefined) {
        joinedPlayer.setDynamicProperties({
            "isHardcore": false,
            "hardcoreTimer": 10800
        });
        threeHourPlayers.add(joinEvent.playerId);
    } else {
        threeHourPlayers.add(joinEvent.playerId);
    }
});

system.runInterval(() => {
    if (threeHourPlayers.size === 0) {
        return
    }
    for (const playerId of threeHourPlayers) {
        const player = world.getEntity(playerId);
        if (player === undefined || !player.isValid) {
            threeHourPlayers.delete(playerId);
            continue
        }
        const oldTimer = player.getDynamicProperty("hardcoreTimer") ?? 10800;
        const newTimer = oldTimer - 1;
        player.setDynamicProperty("hardcoreTimer", newTimer);

        let hours = 0;
        let minutes = 0;
        let seconds = 0;
        if (newTimer >= 3600) {
            hours = Math.floor(newTimer / 3600);
            minutes = Math.floor((newTimer % 3600) / 60);
            seconds = newTimer % 60;
            player.runCommand(`/titleraw @s actionbar {"rawtext": [{"text":"Time till Hardcore: ${hours}h ${minutes}min ${seconds}s"}]}`);
        } else if (newTimer >= 60) {
            minutes = Math.floor(newTimer / 60);
            seconds = newTimer % 60;
            player.runCommand(`/titleraw @s actionbar {"rawtext": [{"text":"Time till Hardcore: ${minutes}min ${seconds}s"}]}`);
        } else {
            seconds = newTimer;
            player.runCommand(`/titleraw @s actionbar {"rawtext": [{"text":"Time till Hardcore: ${seconds}s"}]}`);
        }
        if (newTimer <= 0) {
            player.setDynamicProperty("isHardcore", true);
            threeHourPlayers.delete(playerId);
            player.runCommand(`/title @s title §l§4Hardcore!`);
        }
    }
}, 20);

world.beforeEvents.playerLeave.subscribe((leaveEvent) => {
    const leftPlayerId = leaveEvent.player.id;
    threeHourPlayers.delete(leftPlayerId);
});
