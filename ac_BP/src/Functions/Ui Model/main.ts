import { system, Player, world } from "@minecraft/server";
import { ActionFormData, FormCancelationReason } from "@minecraft/server-ui";
import { isAdmin, rawstr } from "../../Assets/Util";
import { configUI } from "./configui";
import { moderatePlayer } from "./modui";
import { moduleUI } from "./toggleui";
import { error } from "../chatModel/CommandHandler";
import { c } from "../../Assets/Util";
world.afterEvents.itemUse.subscribe(({ itemStack, source: player }) => {
    if (!itemStack.matches("matrix:itemui")) return;
    if (isAdmin(player)) {
        if (c().soundEffect) player.playSound("minecraft:block.note_block.pling", { volume: 3.0 });
        menu(player).catch((err) => error(player, err));
    } else {
        if (c().soundEffect) player.playSound("minecraft:block.note_block.hat", { volume: 3.0 });
        player.sendMessage({
            rawtext: [
                {
                    text: "§bMatrix §7>§c "
                },
                {
                    translate: "acess.itemadmin"
                }
            ]
        });
    }
});
export const adminUI = (player: Player) => system.run(() => menu(player));
export async function menu(player: Player) {
    if (!isAdmin(player)) return;
    new ActionFormData()
        .title(rawstr.drt("ui.title"))
        .button(rawstr.drt("ui.moderateplayer"), "textures/ui/FriendsDiversity.png")
        .button(rawstr.drt("ui.setting"), "textures/ui/gear.png")
        .button(rawstr.drt("ui.exit"), "textures/ui/redX1.png")
        .show(player)
        .then((res) => {
            if (res.canceled) {
                if (res.cancelationReason == FormCancelationReason.UserBusy) system.run(() => adminUI(player));
                return;
            }
            // player: The admin which using the ui
            switch (res.selection) {
                case 0: {
                    // target: The player which selected as a target
                    selectPlayer(player).then((target) => {
                        // Checks if player selected a valid target
                        if (target !== null) {
                            openForIt(player, target);
                        }
                    });
                    break;
                }
                case 1: {
                    // If player wants to set the amticheat
                    settingUI(player);
                    break;
                }
            }
        });
}

function openForIt(player: Player, target: Player) {
    if (isAdmin(target)) {
        player.sendMessage(`§bMatrix §7> §c§lAccess denied! §r§7Moderate players with admin permission`);
    } else {
        moderatePlayer(player, target);
    }
}

async function selectPlayer(player: Player): Promise<Player> {
    const pointAllPlayer = world.getAllPlayers();
    const selectMenu = new ActionFormData().title("Select online player");
    for (const target of pointAllPlayer) {
        let des = "";
        if (player.name == target.name) {
            des = "\n§c§lYou";
        } else if (isAdmin(target)) {
            des = "\n§c§lAdmin";
        }
        selectMenu.button(target.name + des);
    }
    const result = await selectMenu.show(player);
    if (result.canceled) return null;
    return pointAllPlayer[result.selection] ?? null;
}

function settingUI(player: Player) {
    new ActionFormData()
        .title(rawstr.drt("ui.setting"))
        .button(rawstr.drt("ui.config.button"), "textures/ui/gear.png")
        .button(rawstr.drt("ui.toggle.button"), "textures/ui/gear.png")
        .button(rawstr.drt("ui.exit"), "textures/ui/redX1.png")
        .show(player)
        .then((res) => {
            if (res.canceled) return;
            switch (res.selection) {
                case 0: {
                    configUI(player);
                    break;
                }
                case 1: {
                    moduleUI(player);
                    break;
                }
            }
        });
}
