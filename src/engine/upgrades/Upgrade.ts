import {Saveable} from "@/engine/saving/Saveable";
import {Currency} from "@/engine/features/wallet/Currency";
import {App} from "@/App";
import {UpgradeSaveData} from "@/engine/upgrades/UpgradeSaveData";
import {UpgradeType} from "@/engine/upgrades/UpgradeType";

/**
 * Generic upgrade class
 */

export abstract class Upgrade implements Saveable {
    identifier: string;
    type: UpgradeType;
    displayName: string;
    maxLevel: number;
    level: number;

    // Describes whether this upgrade increases or decreases a number.
    // (e.g. power is increasing, time is decreasing).
    increasing: boolean;


    protected constructor(identifier: string, type: UpgradeType, displayName: string, maxLevel: number, increasing = true) {
        this.identifier = identifier;
        this.type = type;
        this.displayName = displayName;
        this.maxLevel = maxLevel;
        this.level = 0;
        this.increasing = increasing;
    }

    abstract getCost(): Currency;

    abstract getBonus(level: number): number;

    getUpgradeBonus(): number {
        if (!this.isMaxLevel()) {
            return this.getBonus(this.level + 1) - this.getBonus(this.level);
        }
        return 0;
    }

    isMaxLevel(): boolean {
        return this.level >= this.maxLevel;
    }

    canAfford(): boolean {
        return App.game.wallet.hasCurrency(this.getCost());
    }

    // Override in subclass when other requirements exist.
    canBuy(): boolean {
        return this.level < this.maxLevel && this.canAfford();
    }

    buy(): void {
        if (this.canBuy()) {
            App.game.wallet.loseCurrency(this.getCost());
            this.levelUp();
        }
    }

    levelUp(): void {
        this.level = this.level + 1;
    }


    // Save logic
    saveKey: string = this.identifier;

    load(data: UpgradeSaveData): void {
        this.level = data.level;
    }

    parseSaveData(json: Record<string, unknown>): UpgradeSaveData {
        return new UpgradeSaveData(json?.identifier as string, json?.level as number ?? 0)
    }

    save(): UpgradeSaveData {
        return new UpgradeSaveData(this.identifier, this.level)
    }

}
