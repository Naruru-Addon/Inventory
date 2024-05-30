import { Player, world } from "@minecraft/server";
import * as UI from "@minecraft/server-ui";
import targetInventoryList from "./targetInventoryList";

/**
 * @param {Player} player 
 */
export default async function playerList(player) {
    const form = new UI.ActionFormData();
    const targets = world.getAllPlayers()

    form.title("プレイヤーリスト");

    for (const target of targets) {
        form.button(target.name);
    }

    const { selection, canceled } = await form.show(player);

    if (canceled) return;
    
    targetInventoryList(player, targets[selection]);
}