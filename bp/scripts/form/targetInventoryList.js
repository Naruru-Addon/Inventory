import { EquipmentSlot, ItemStack, ItemType, ItemTypes, Player, world } from "@minecraft/server";
import * as UI from "@minecraft/server-ui";
import { ChestFormData } from "../extensions/forms";
import playerList from "./playerList";

/**
 * @param {Player} player 
 * @param {Player} target 
 */
export default async function targetInventoryList(player, target) {
    const inventory = player.getComponent("inventory");
    const equippable = player.getComponent("equippable");
    const container = inventory.container;
    const offhand = equippable.getEquipment(EquipmentSlot.Offhand);
    const head = equippable.getEquipment(EquipmentSlot.Head);
    const chest = equippable.getEquipment(EquipmentSlot.Chest);
    const legs = equippable.getEquipment(EquipmentSlot.Legs);
    const feet = equippable.getEquipment(EquipmentSlot.Feet)
    const form = new ChestFormData("54");
    let items = [];

    form.title(`${target.name}のインベントリー`);
    form.button(0, "プレイヤーリスト", [], "textures/ui/FriendsIcon");
    form.button(1, "リロード", [], "textures/ui/recap_glyph_desaturated");

    for (let slot = 0; slot < container.size; slot++) {
        const i = slot + 9;
        const item = container.getItem(slot);

        if (item) {
            form.button(i, item.typeId, enchantDesc(item, []), item.typeId, item.amount, isEnchant(item));
            items.push({ item: item, slot: slot, equipment: false });
            continue;
        }

        items.push({ item: "", slot: slot, equipment: false });
    }

    if (head) {
        form.button(45, head.typeId, enchantDesc(head, []), head.typeId, head.amount, isEnchant(head));
        items.push({ item: head, slot: EquipmentSlot.Head, equipment: true });
    } else {
        items.push({ item: "", slot: 0, equipment: false });
    }
    if (chest) {
        form.button(46, chest.typeId, enchantDesc(chest, []), chest.typeId, chest.amount, isEnchant(chest));
        items.push({ item: chest, slot: EquipmentSlot.Chest, equipment: true });
    } else {
        items.push({ item: "", slot: 0, equipment: false });
    }
    if (legs) {
        form.button(47, legs.typeId, enchantDesc(legs, []), legs.typeId, legs.amount, isEnchant(legs));
        items.push({ item: legs, slot: EquipmentSlot.Legs, equipment: true });
    } else {
        items.push({ item: "", slot: 0, equipment: false });
    }
    if (feet) {
        form.button(48, feet.typeId, enchantDesc(feet, []), feet.typeId, feet.amount, isEnchant(feet));
        items.push({ item: feet, slot: EquipmentSlot.Feet, equipment: true });
    } else {
        items.push({ item: "", slot: 0, equipment: false });
    }
    if (offhand) {
        form.button(49, offhand.typeId, enchantDesc(offhand, []), offhand.typeId, offhand.amount, isEnchant(offhand));
        items.push({ item: offhand, slot: EquipmentSlot.Offhand, equipment: true });
    } else {
        items.push({ item: "", slot: 0, equipment: false });
    }

    const { selection, canceled } = await form.show(player);

    if (canceled) return;
    if (selection === 0) return playerList(player);
    if (selection === 1) return targetInventoryList(player, target);

    selectItem(player, target, items[selection - 9]);
}

/** 
 * @param {Player} player 
 * @param {Player} target 
 * @param {Object} obj
 * @param {ItemStack} obj.item
 */
async function selectItem(player, target, obj) {
    const { item } = obj;
    const form = new UI.ActionFormData();

    form.title(item.typeId);
    form.button("戻る", "textures/ui/redX1");
    form.button("移動", "textures/ui/refresh_hover");
    form.button("複製", "textures/ui/copy");
    form.button("§c削除", "textures/ui/trash_light");

    const { selection, canceled } = await form.show(player);

    if (canceled) return;
    switch (selection) {
        case 0: return targetInventoryList(player, target);
        case 1: return move(player, target, obj);
        case 2: return duplication(player, obj);
        case 3: return deleteCheck(player, target, obj);
    }
}

/**
 * 
 * @param {Player} player 
 * @param {Player} target 
 * @param {Object} obj 
 * @param {ItemStack} obj.item
 * @param {number | string} obj.slot
 */
async function deleteCheck(player, target, obj) {
    const { item } = obj;
    const form = new UI.ActionFormData();

    form.title("確認");
    form.body(`${item.typeId}を削除しますか？削除すると、§c元に戻すことはできません。`);
    form.button("はい");
    form.button("いいえ");

    const { selection, canceled } = await form.show(player);

    if (canceled) return;
    if (selection === 0) return remove(target, obj);
    if (selection === 1) return selectItem(player, target, obj);
}

/**
 * @param {ItemStack} item 
 * @param {string[]} desc 
 */
function enchantDesc(item, desc) {
    const enchantable = item.getComponent("enchantable");

    if (enchantable) {
        if (enchantable.getEnchantments() > 0) {
            for (const enchant of enchantable.getEnchantments()) {
                desc.push(`${enchant.type.id} - ${enchant.level}`);
            }
        }
    }

    return desc;
}

/**
 * @param {ItemStack} item 
 * @returns {boolean}
 */
function isEnchant(item) {
    const enchantable = item.getComponent("enchantable");

    if (enchantable) {
        if (enchantable.getEnchantments() > 0) {
            return true
        }
    }

    return false;
}

/**
 * @param {Player} player 
 * @param {Player} target 
 * @param {Object} obj
 * @param {ItemStack} obj.item
 * @param {number | string} obj.slot
 * @param {boolean} obj.equipment
 */
function move(player, target, obj) {
    const { item, slot, equipment } = obj;
    const targetInventory = target.getComponent("inventory");
    const playerInventory = player.getComponent("inventory");
    const targetEquipment = target.getComponent("equippable");
    const targetContainer = targetInventory.container;
    const playerContainer = playerInventory.container;

    if (equipment) {
        targetEquipment.setEquipment(slot);
    } else {
        targetContainer.setItem(slot);
    }

    playerContainer.addItem(item.clone());
}

/**
 * @param {Player} player 
 * @param {Player} target 
 * @param {Object} obj
 * @param {ItemStack} obj.item
 */
function duplication(player, obj) {
    const { item } = obj;
    const playerInventory = player.getComponent("inventory");
    const playerContainer = playerInventory.container;

    playerContainer.addItem(item.clone());
}

/**
 * @param {Player} player 
 * @param {Player} target 
 * @param {Object} obj
 * @param {number | string} obj.slot
 * @param {boolean} obj.equipment
 */
function remove(target, obj) {
    const { slot, equipment } = obj;
    const targetInventory = target.getComponent("inventory");
    const targetEquipment = target.getComponent("equippable");
    const targetContainer = targetInventory.container;

    if (equipment) {
        targetEquipment.setEquipment(slot);
    } else {
        targetContainer.setItem(slot);
    }
}