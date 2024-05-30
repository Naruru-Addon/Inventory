import { system, world } from "@minecraft/server";
import config from "./config";
import targetInventoryList from "./form/targetInventoryList";
import playerList from "./form/playerList";

system.afterEvents.scriptEventReceive.subscribe(ev => {
    const { id, message, sourceEntity } = ev;

    if (sourceEntity) {
        const player = sourceEntity;

        if (id === config.commandId) {
            if (message.trim() !== "") {
                const targetName = message.replace("@", "");
            
                for (const target of world.getAllPlayers()) {
                    if (target.name === targetName) {
                        targetInventoryList(player, target);
                    }
                }
            } else {
                playerList(player);
            }
        }
    }
});