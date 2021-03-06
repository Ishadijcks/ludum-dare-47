import {GameState} from "./GameState";
import {Feature} from "./Feature";
import {Wallet} from "@/engine/features/wallet/Wallet";
import {LocalStorage} from "@/engine/saving/LocalStorage";
import {Settings} from "@/engine/features/settings/Settings";
import {Statistics} from "@/engine/features/statistics/Statistics";
import {Achievements} from "@/engine/features/achievements/Achievements";
import {TimeLine} from "@/game/features/timeline/TimeLine";
import {Scrap} from "@/game/features/scrap/Scrap";
import {Gasoline} from "@/game/features/gasoline/Gasoline";
import {Lightning} from "@/game/features/lightning/Lightning";
import {Plutonium} from "@/game/features/plutonium/Plutonium";

export class Game {
    private _tickInterval: any;

    public timeLine: TimeLine;

    public scrap: Scrap;
    public gasoline: Gasoline;
    public lightning: Lightning;
    public plutonium: Plutonium;

    public wallet: Wallet;
    public settings: Settings;
    public statistics: Statistics;
    public achievements: Achievements;

    public allFeatures: Feature[];

    public state: GameState;

    private readonly TICK_DURATION_MS = 50.0;

    constructor(timeLine: TimeLine, scrap: Scrap, gasoline: Gasoline, lightning: Lightning, plutonium: Plutonium, wallet: Wallet, settings: Settings, statistics: Statistics, achievements: Achievements) {
        this.allFeatures = [];

        this.statistics = this.registerFeature(statistics);

        this.timeLine = this.registerFeature(timeLine);

        this.scrap = this.registerFeature(scrap);
        this.gasoline = this.registerFeature(gasoline);
        this.lightning = this.registerFeature(lightning);
        this.plutonium = this.registerFeature(plutonium);

        this.wallet = this.registerFeature(wallet)
        this.settings = this.registerFeature(settings);
        this.achievements = this.registerFeature(achievements);

        this.state = GameState.starting;
    }

    /**
     * Register a feature so it becomes part of all features
     */
    private registerFeature<T extends Feature>(feature: T): T {
        this.allFeatures.push(feature);
        return feature;
    }

    /**
     * Update all features
     */
    private update(): void {
        if (this.state != GameState.playing) {
            return;
        }

        for (const feature of this.getAllFeatures()) {
            feature.update(this.TICK_DURATION_MS / 1000.0)
        }
    }


    /**
     * Initialize all features
     */
    public initialize(): void {
        for (const feature of this.getAllFeatures()) {
            feature.initialize();
        }

    }

    /**
     * Start the main update loop
     */
    public start(): void {
        if (this.state === GameState.playing) {
            console.error("Cannot start the game twice");
            return;
        }

        this._tickInterval = setInterval(() => this.update(), this.TICK_DURATION_MS);

        this.state = GameState.playing;
        console.log("Started");
    }

    /**
     * Stop the main update loop
     */
    public stop(): void {
        clearInterval(this._tickInterval);

        this.state = GameState.stopped;
        console.log("Stopped");
    }

    /**
     * Recursively save all registered features
     */
    public save(): void {
        const res: Record<string, unknown> = {};
        for (const feature of this.getAllFeatures()) {
            res[feature.saveKey] = feature.save()
        }
        LocalStorage.store('save', res)
    }

    /**
     * Delete the locally stored save
     */
    public deleteSave(): void {
        LocalStorage.delete('save');
    }

    /**
     * Recursively load all registered features
     */
    public load(): void {
        const saveData = LocalStorage.get('save')
        if (saveData == null) {
            return;
        }
        for (const feature of this.getAllFeatures()) {
            const featureSavedata: Record<string, unknown> = saveData[feature.saveKey] as Record<string, unknown> ?? {};
            feature.load(feature.parseSaveData(featureSavedata));
        }
    }


    /**
     * Return all registered features, see this.registerFeature()
     */
    public getAllFeatures(): Feature[] {
        return this.allFeatures;
    }

    getTotalScrapMultiplier(): number {
        let res = 1;
        for (const feature of this.getAllFeatures()) {
            res *= feature.getScrapMultiplier();
        }
        return res;
    }

    getTotalGasolineMultiplier(): number {
        let res = 1;
        for (const feature of this.getAllFeatures()) {
            res *= feature.getGasolineMultiplier();
        }
        return res;
    }

    getLightningMultiplier(): number {
        let res = 1;
        for (const feature of this.getAllFeatures()) {
            res *= feature.getLightningMultiplier();
        }
        return res;
    }

    getPlutoniumMultiplier(): number {
        let res = 1;
        for (const feature of this.getAllFeatures()) {
            res *= feature.getPlutoniumMultiplier();
        }
        return res;
    }

}
