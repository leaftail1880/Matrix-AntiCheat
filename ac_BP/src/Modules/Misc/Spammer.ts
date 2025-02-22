import { world, system, ChatSendBeforeEvent } from "@minecraft/server";
import { flag, isAdmin } from "../../Assets/Util";
import { registerModule, configi } from "../Modules.js";
import { MinecraftEntityTypes } from "../../node_modules/@minecraft/vanilla-data/lib/index";
import { AnimationControllerTags } from "../../Data/EnumData";

/**
 * @author ravriv
 * @description This check can detect players with spammer clients
 */

const lastFlag: Map<string, number> = new Map<string, number>();

function firstEvent(config: configi, event: ChatSendBeforeEvent) {
    const player = event.sender;
    if (isAdmin(player)) return;
    if (player.hasTag(AnimationControllerTags.attackTime)) {
        //A - false positive: very low, efficiency: mid
        if (Date.now() - lastFlag.get(player.id) < 3000) {
            event.cancel = true;
            system.run(() => flag(player, "Spammer", "A", config.antiSpammer.maxVL, config.antiSpammer.punishment, ["Type" + ":" + "AttackTime"]));
        }
        lastFlag.set(player.id, Date.now());
    }

    //check if the player send message while using item
    else if (player.hasTag(AnimationControllerTags.usingItem)) {
        //B - false positive: mid, efficiency: mid
        if (Date.now() - lastFlag.get(player.id) < 3000) {
            event.cancel = true;
            system.run(() => flag(player, "Spammer", "B", config.antiSpammer.maxVL, config.antiSpammer.punishment, ["Type" + ":" + "UsingItem"]));
        }
        lastFlag.set(player.id, Date.now());
    } else {
        const { x, z } = player.getVelocity();
        //check if the player send message while moving
        if (
            player.hasTag(AnimationControllerTags.moving) &&
            player.hasTag(AnimationControllerTags.alive) &&
            player.isOnGround &&
            !player.isJumping &&
            !player.isInWater &&
            !player.isGliding &&
            !player.isFalling &&
            !(player.lastExplosionTime && Date.now() - player.lastExplosionTime < 1000) &&
            !player.isInWater &&
            Math.hypot(x, z) > 0.35
        ) {
            //C - false positive: low, efficiency: high
            if (Date.now() - lastFlag.get(player.id) < 3000) {
                event.cancel = true;
                system.run(() => flag(player, "Spammer", "C", config.antiSpammer.maxVL, config.antiSpammer.punishment, ["Type" + ":" + "Moving"]));
            }
            lastFlag.set(player.id, Date.now());
        }
    }
}

registerModule("antiSpammer", false, [lastFlag], {
    worldSignal: world.beforeEvents.chatSend,
    playerOption: { entityTypes: [MinecraftEntityTypes.Player] },
    then: async (config, event: ChatSendBeforeEvent) => {
        firstEvent(config, event);
    },
});
