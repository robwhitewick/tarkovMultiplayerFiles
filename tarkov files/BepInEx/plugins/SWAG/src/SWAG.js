"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ConfigTypes_1 = require("C:/snapshot/project/obj/models/enums/ConfigTypes");
const ContextVariableType_1 = require("C:/snapshot/project/obj/context/ContextVariableType");
const JsonUtil_1 = require("C:/snapshot/project/obj/utils/JsonUtil");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ClassDef = __importStar(require("./ClassDef"));
const ClassDef_1 = require("./ClassDef");
const config_json_1 = __importDefault(require("../config/config.json"));
const bossConfig_json_1 = __importDefault(require("../config/bossConfig.json"));
const eventsBossConfig_json_1 = __importDefault(require("../config/eventsBossConfig.json"));
const modName = "SWAG";
let logger;
let LocationCallbacks;
LocationCallbacks;
let jsonUtil;
JsonUtil_1.JsonUtil;
let configServer;
let botConfig;
let pmcConfig;
let iGlobals;
let databaseServer;
let locations;
let seasonalEvents;
let randomUtil;
let BossWaveSpawnedOnceAlready;
const customPatterns = {};
const globalPatterns = {};
class SWAG {
    static savedLocationData = {
        factory4_day: undefined,
        factory4_night: undefined,
        bigmap: undefined,
        interchange: undefined,
        laboratory: undefined,
        lighthouse: undefined,
        rezervbase: undefined,
        shoreline: undefined,
        tarkovstreets: undefined,
        woods: undefined,
        sandbox: undefined,
        // unused
        develop: undefined,
        hideout: undefined,
        privatearea: undefined,
        suburbs: undefined,
        terminal: undefined,
        town: undefined,
    };
    static pmcType = ["sptbear", "sptusec"];
    static randomWaveTimer = {
        time_min: 0,
        time_max: 0,
    };
    static actual_timers = {
        time_min: 0,
        time_max: 0,
    };
    static waveCounter = {
        count: 1,
    };
    static raid_time = {
        time_of_day: "day",
    };
    static bossCount = {
        count: 0,
    };
    preAkiLoad(container) {
        const HttpResponse = container.resolve("HttpResponseUtil");
        const staticRouterModService = container.resolve("StaticRouterModService");
        staticRouterModService.registerStaticRouter(`${modName}/client/match/offline/end`, [
            {
                url: "/client/match/offline/end",
                action: (url, info, sessionID, output) => {
                    SWAG.ClearDefaultSpawns();
                    SWAG.ConfigureMaps();
                    return LocationCallbacks.getLocationData(url, info, sessionID);
                },
            },
        ], "SWAG");
        staticRouterModService.registerStaticRouter(`${modName}/client/locations`, [
            {
                url: "/client/locations",
                action: (url, info, sessionID, output) => {
                    SWAG.ClearDefaultSpawns();
                    SWAG.ConfigureMaps();
                    return LocationCallbacks.getLocationData(url, info, sessionID);
                },
            },
        ], "SWAG");
        staticRouterModService.registerStaticRouter(`${modName}/client/items`, [
            {
                url: "/client/items",
                action: (url, info, sessionID, output) => {
                    const locationConfig = container.resolve("ConfigServer").getConfig(ConfigTypes_1.ConfigTypes.LOCATION);
                    // as of SPT 3.6.0 we need to disable the new spawn system so that SWAG can clear spawns properly
                    if (!config_json_1.default?.UseDefaultSpawns?.Waves ||
                        !config_json_1.default?.UseDefaultSpawns?.Bosses ||
                        !config_json_1.default?.UseDefaultSpawns?.TriggeredWaves) {
                        SWAG.disableSpawnSystems();
                    }
                    // disable more vanilla spawn stuff
                    locationConfig.splitWaveIntoSingleSpawnsSettings.enabled = false;
                    locationConfig.rogueLighthouseSpawnTimeSettings.enabled = false;
                    locationConfig.fixEmptyBotWavesSettings.enabled = false;
                    locationConfig.addOpenZonesToAllMaps = false;
                    locationConfig.addCustomBotWavesToMaps = false;
                    locationConfig.enableBotTypeLimits = false;
                    logger.info("SWAG: Vanilla spawn systems disabled");
                    return output;
                },
            },
        ], "SWAG");
        staticRouterModService.registerStaticRouter(`${modName}/client/raid/configuration`, [
            {
                url: "/client/raid/configuration",
                action: (url, info, sessionID, output) => {
                    try {
                        // PMCs should never convert - we need full control here
                        const bot_config = container
                            .resolve("ConfigServer")
                            .getConfig(ConfigTypes_1.ConfigTypes.BOT);
                        const pmc_config = container
                            .resolve("ConfigServer")
                            .getConfig(ConfigTypes_1.ConfigTypes.PMC);
                        pmc_config.convertIntoPmcChance["assault"].min = 0;
                        pmc_config.convertIntoPmcChance["assault"].max = 0;
                        pmc_config.convertIntoPmcChance["cursedassault"].min = 0;
                        pmc_config.convertIntoPmcChance["cursedassault"].max = 0;
                        pmc_config.convertIntoPmcChance["pmcbot"].min = 0;
                        pmc_config.convertIntoPmcChance["pmcbot"].max = 0;
                        pmc_config.convertIntoPmcChance["exusec"].min = 0;
                        pmc_config.convertIntoPmcChance["exusec"].max = 0;
                        pmc_config.convertIntoPmcChance["arenafighter"].min = 0;
                        pmc_config.convertIntoPmcChance["arenafighter"].max = 0;
                        pmc_config.convertIntoPmcChance["arenafighterevent"].min = 0;
                        pmc_config.convertIntoPmcChance["arenafighterevent"].max = 0;
                        pmc_config.convertIntoPmcChance["crazyassaultevent"].min = 0;
                        pmc_config.convertIntoPmcChance["crazyassaultevent"].max = 0;
                        logger.info("SWAG: PMC conversion is OFF (this is good - be sure this loads AFTER Realism/SVM)");
                        const appContext = container.resolve("ApplicationContext");
                        const matchInfoStartOff = appContext
                            .getLatestValue(ContextVariableType_1.ContextVariableType.RAID_CONFIGURATION)
                            .getValue();
                        const weatherController = container.resolve("WeatherController");
                        const time = weatherController.generate().time;
                        let realTime = "";
                        if (matchInfoStartOff.timeVariant === "PAST") {
                            realTime = getTime(time, 12);
                        }
                        if (matchInfoStartOff.timeVariant === "CURR") {
                            realTime = time;
                        }
                        function getTime(time, hourDiff) {
                            let [h, m] = time.split(":");
                            if (parseInt(h) == 0) {
                                return `${h}:${m}`;
                            }
                            h = Math.abs(parseInt(h) - hourDiff);
                            return `${h}:${m}`;
                        }
                        function getTOD(time) {
                            let TOD = "";
                            let [h, m] = time.split(":");
                            if ((matchInfoStartOff.location != "factory4_night" &&
                                parseInt(h) >= 5 &&
                                parseInt(h) < 22) ||
                                matchInfoStartOff.location === "factory4_day" ||
                                matchInfoStartOff.location === "Laboratory" ||
                                matchInfoStartOff.location === "laboratory") {
                                TOD = "day";
                            }
                            else {
                                TOD = "night";
                            }
                            return TOD;
                        }
                        SWAG.raid_time.time_of_day = getTOD(realTime);
                        // set map caps
                        if (SWAG.raid_time.time_of_day === "day") {
                            bot_config.maxBotCap.factory4_day = config_json_1.default.MaxBotCap.factory;
                            bot_config.maxBotCap.bigmap = config_json_1.default.MaxBotCap.customs;
                            bot_config.maxBotCap.interchange = config_json_1.default.MaxBotCap.interchange;
                            bot_config.maxBotCap.shoreline = config_json_1.default.MaxBotCap.shoreline;
                            bot_config.maxBotCap.woods = config_json_1.default.MaxBotCap.woods;
                            bot_config.maxBotCap.rezervbase = config_json_1.default.MaxBotCap.reserve;
                            bot_config.maxBotCap.laboratory = config_json_1.default.MaxBotCap.laboratory;
                            bot_config.maxBotCap.lighthouse = config_json_1.default.MaxBotCap.lighthouse;
                            bot_config.maxBotCap.tarkovstreets = config_json_1.default.MaxBotCap.streets;
                            bot_config.maxBotCap.sandbox = config_json_1.default.MaxBotCap.sandbox;
                            logger.info("SWAG: Max Bot Caps set");
                        }
                        else if (SWAG.raid_time.time_of_day === "night") {
                            bot_config.maxBotCap.factory4_night =
                                config_json_1.default.NightMaxBotCap.factory_night;
                            bot_config.maxBotCap.bigmap = config_json_1.default.NightMaxBotCap.customs;
                            bot_config.maxBotCap.interchange =
                                config_json_1.default.NightMaxBotCap.interchange;
                            bot_config.maxBotCap.shoreline =
                                config_json_1.default.NightMaxBotCap.shoreline;
                            bot_config.maxBotCap.woods = config_json_1.default.NightMaxBotCap.woods;
                            bot_config.maxBotCap.rezervbase = config_json_1.default.NightMaxBotCap.reserve;
                            bot_config.maxBotCap.laboratory =
                                config_json_1.default.NightMaxBotCap.laboratory;
                            bot_config.maxBotCap.lighthouse =
                                config_json_1.default.NightMaxBotCap.lighthouse;
                            bot_config.maxBotCap.tarkovstreets =
                                config_json_1.default.NightMaxBotCap.streets;
                            bot_config.maxBotCap.sandbox = config_json_1.default.NightMaxBotCap.sandbox;
                            logger.info("SWAG: Night Raid Max Bot Caps set");
                        }
                        return HttpResponse.nullResponse();
                    }
                    catch (e) {
                        logger.info("SWAG: Failed To modify PMC conversion, you may have more PMCs than you're supposed to" +
                            e);
                        return HttpResponse.nullResponse();
                    }
                },
            },
        ], "SWAG");
    }
    postDBLoad(container) {
        logger = container.resolve("WinstonLogger");
        LocationCallbacks =
            container.resolve("LocationCallbacks");
        jsonUtil = container.resolve("JsonUtil");
        configServer = container.resolve("ConfigServer");
        botConfig = configServer.getConfig(ConfigTypes_1.ConfigTypes.BOT);
        pmcConfig = configServer.getConfig(ConfigTypes_1.ConfigTypes.PMC);
        databaseServer = container.resolve("DatabaseServer");
        locations = databaseServer.getTables().locations;
        randomUtil = container.resolve("RandomUtil");
        seasonalEvents = container.resolve("SeasonalEventService");
        SWAG.ReadAllPatterns();
    }
    /**
     * Returns all available OpenZones specified in location.base.OpenZones as well as any OpenZone found in the SpawnPointParams.
     * Filters out all sniper zones
     * @param map
     * @returns
     */
    static GetOpenZones(map) {
        const baseobj = locations[map]?.base;
        // Get all OpenZones defined in the base obj that do not include sniper zones. Need to filter for empty strings as well.
        const foundOpenZones = baseobj?.OpenZones?.split(",")
            .filter((name) => !name.includes("Snipe"))
            .filter((name) => name.trim() !== "") ?? [];
        // Sometimes there are zones in the SpawnPointParams that arent listed in the OpenZones, parse these and add them to the list of zones
        baseobj?.SpawnPointParams?.forEach((spawn) => {
            //check spawn for open zones and if it doesn't exist add to end of array
            if (spawn?.BotZoneName &&
                !foundOpenZones.includes(spawn.BotZoneName) &&
                !spawn.BotZoneName.includes("Snipe")) {
                foundOpenZones.push(spawn.BotZoneName);
            }
        });
        //logger.info(`SWAG: Open Zones(${map}): ${JSON.stringify(foundOpenZones)}`);
        return foundOpenZones;
    }
    static ReadAllPatterns() {
        //find dirpath and get one level up
        let dirpath = __dirname;
        dirpath = dirpath.split("\\").slice(0, -1).join("\\");
        //Read all patterns from files in /patterns
        const fs = require("fs");
        if (!fs.existsSync(`${dirpath}/config/patterns/`)) {
            console.log("SWAG: Pattern Directory not found");
            return;
        }
        const files = fs.readdirSync(`${dirpath}/config/patterns/`);
        for (let file of files) {
            const temppattern = require(`${dirpath}/config/patterns/${file}`);
            const tempname = file.split(".")[0];
            //parse the json and push it to the customPatterns array
            customPatterns[tempname] = temppattern;
            // logger.info("SWAG: Loaded Pattern: " + tempname);
        }
    }
    //This is the main top level function
    static ConfigureMaps() {
        // read all customPatterns and push them to the locations table. Invalid maps were being read, those should be filteredout as it causes an error when
        // assigning an openzone to a map that doesn't exist (base)
        Object.keys(locations)
            .filter((name) => ClassDef.validMaps.includes(name))
            .forEach((globalmap) => {
            for (let pattern in customPatterns) {
                //read mapWrapper in pattern and set its values to be used locally
                const mapWrapper = customPatterns[pattern][0];
                const mapName = mapWrapper.MapName.toLowerCase();
                const mapGroups = mapWrapper.MapGroups;
                const mapBosses = mapWrapper.MapBosses;
                //reset the bossWaveSpawnedOnceAlready flag
                BossWaveSpawnedOnceAlready = false;
                //if mapName is not the same as the globalmap, skip. otherwise if all or matches, continue
                if (mapName === globalmap || mapName === "all") {
                    config_json_1.default.DebugOutput && logger.warning(`Configuring ${globalmap}`);
                    // Configure random wave timer.. needs to be reset each map
                    SWAG.randomWaveTimer.time_min =
                        config_json_1.default.GlobalSCAVRandomWaveTimer.WaveTimerMinSec;
                    SWAG.randomWaveTimer.time_max =
                        config_json_1.default.GlobalSCAVRandomWaveTimer.WaveTimerMaxSec;
                    SWAG.SetUpGroups(mapGroups, mapBosses, globalmap);
                }
                //config.DebugOutput && logger.warning(`Waves for ${globalmap} : ${JSON.stringify(locations[globalmap].base?.waves)}`);
            }
        });
    }
    /**
     * Groups can be marked random with the RandomTimeSpawn. groups that dont have a time_max or time_min will also be considered random
     * @param group
     * @returns
     */
    static isGroupRandom(group) {
        const isRandomMin = group.Time_min === null || group.Time_min === undefined;
        const isRandomMax = group.Time_max === null || group.Time_max === undefined;
        return group.RandomTimeSpawn || isRandomMax || isRandomMin;
    }
    static SetUpGroups(mapGroups, mapBosses, globalmap) {
        //set up local variables to contain outside of loop
        const RandomGroups = [];
        const RandomBossGroups = [];
        const StaticGroups = [];
        const StaticBossGroups = [];
        const AlreadySpawnedGroups = [];
        const AlreadySpawnedBossGroups = [];
        //read mapGroups and see if value Random, OnlySpawnOnce, or BotZone is set and set local values
        for (let group of mapGroups) {
            const groupRandom = SWAG.isGroupRandom(group);
            //if groupRandom is true, push group to RandomGroups, otherwise push to StaticGroups
            if (groupRandom) {
                RandomGroups.push(group);
            }
            else {
                StaticGroups.push(group);
            }
        }
        //read BossGroups and see if value Random, OnlySpawnOnce, or BotZone is set and set local values
        for (let boss of mapBosses) {
            const groupRandom = boss.RandomTimeSpawn;
            //if groupRandom is true, push group to RandomGroups, otherwise push to StaticGroups
            if (groupRandom) {
                RandomBossGroups.push(boss);
            }
            else {
                StaticBossGroups.push(boss);
            }
        }
        //if RandomGroups is not empty, set up bot spawning for random groups
        if (RandomGroups.length > 0) {
            //call SetUpRandomBots amount of times specified in config.RandomWaveCount
            for (let i = 0; i < config_json_1.default.RandomWaveCount; i++) {
                SWAG.SetUpRandomBots(RandomGroups, globalmap, AlreadySpawnedGroups);
            }
        }
        //if StaticGroups is not empty, set up bot spawning for static groups
        if (StaticGroups.length > 0) {
            SWAG.SetUpStaticBots(StaticGroups, globalmap, AlreadySpawnedGroups);
        }
        //if RandomBossGroups is not empty, set up bot spawning for random boss groups
        if (RandomBossGroups.length > 0) {
            //call SetUpRandomBots amount of times specified in config.RandomWaveCount
            for (let i = 0; i < config_json_1.default.BossWaveCount; i++) {
                SWAG.SetUpRandomBosses(RandomBossGroups, globalmap, AlreadySpawnedBossGroups);
            }
        }
        //if StaticBossGroups is not empty, set up bot spawning for static boss groups
        if (StaticBossGroups.length > 0) {
            SWAG.SetUpStaticBosses(StaticBossGroups, globalmap, AlreadySpawnedBossGroups);
        }
    }
    static SetUpRandomBots(RandomGroups, globalmap, AlreadySpawnedGroups) {
        //read a random group from RandomGroups
        const randomGroup = randomUtil.getArrayValue(RandomGroups);
        SWAG.SpawnBots(randomGroup, globalmap, AlreadySpawnedGroups);
    }
    static SetUpRandomBosses(RandomBossGroups, globalmap, AlreadySpawnedBossGroups) {
        //read a random group from RandomBossGroups
        const randomBossGroup = randomUtil.getArrayValue(RandomBossGroups);
        SWAG.SpawnBosses(randomBossGroup, globalmap, AlreadySpawnedBossGroups);
    }
    static SetUpStaticBots(StaticGroups, globalmap, AlreadySpawnedGroups) {
        //read StaticGroups and set local values
        for (let group of StaticGroups) {
            for (let i = 0; i < config_json_1.default.RandomWaveCount; i++) {
                SWAG.SpawnBots(group, globalmap, AlreadySpawnedGroups);
            }
            // i've completed looping through waves, so lets reset timers for the next group
            SWAG.actual_timers.time_min = 0;
            SWAG.actual_timers.time_max = 0;
            SWAG.waveCounter.count = 1;
        }
    }
    static SetUpStaticBosses(StaticBossGroups, globalmap, AlreadySpawnedBossGroups) {
        // lets shuffle bosses around in case skip boss is true
        // so that a random boss is spawned every time
        let randomizedBossGroups = this.shuffleArray(StaticBossGroups);
        for (let i = 0; i < randomizedBossGroups.length; i++) {
            let boss = randomizedBossGroups[i];
            let actual_boss_name = boss.BossName;
            let boss_name = ClassDef_1.reverseBossNames[boss.BossName]
                ? ClassDef_1.reverseBossNames[boss.BossName]
                : boss.BossName;
            if ((actual_boss_name.startsWith("boss") ||
                actual_boss_name.startsWith("useccommander")) &&
                actual_boss_name != "bossboarsniper") {
                let spawnChance = boss.BossChance
                    ? boss.BossChance
                    : bossConfig_json_1.default.BossSpawns[ClassDef_1.reverseMapNames[globalmap]][boss_name].chance;
                if (spawnChance != 0) {
                    SWAG.SpawnBosses(boss, globalmap, AlreadySpawnedBossGroups);
                    SWAG.bossCount.count += 1;
                }
                else {
                    continue;
                }
            }
            else if (seasonalEvents.christmasEventEnabled() && actual_boss_name == "gifter") {
                let spawnChance = boss.BossChance
                    ? boss.BossChance
                    : eventsBossConfig_json_1.default.BossSpawns[ClassDef_1.reverseMapNames[globalmap]][boss_name].chance;
                if (spawnChance != 0) {
                    SWAG.SpawnBosses(boss, globalmap, AlreadySpawnedBossGroups);
                }
                else {
                    continue;
                }
            }
            else {
                SWAG.SpawnBosses(boss, globalmap, AlreadySpawnedBossGroups);
            }
        }
        SWAG.bossCount.count = 0;
    }
    static SpawnBosses(boss, globalmap, AlreadySpawnedBossGroups) {
        //check to see if RandomBossGroupSpawnOnce is true, if so, check to see if group is already spawned
        if (boss.OnlySpawnOnce && AlreadySpawnedBossGroups.includes(boss)) {
            return;
        }
        AlreadySpawnedBossGroups.push(boss);
        let boss_name = boss.BossName;
        if (bossConfig_json_1.default.TotalBossesPerMap[ClassDef_1.reverseMapNames[globalmap]] === 0) {
            config_json_1.default.DebugOutput &&
                logger.info("SWAG: TotalBosses set to 0 for this map, skipping boss spawn");
            return;
        }
        else if (BossWaveSpawnedOnceAlready &&
            (boss_name.startsWith("boss") || boss_name.startsWith("useccommander")) &&
            boss_name != "bossboarsniper") {
            boss_name = ClassDef_1.reverseBossNames[boss.BossName]
                ? ClassDef_1.reverseBossNames[boss.BossName]
                : boss.BossName;
            let spawnChance = boss.BossChance
                ? boss.BossChance
                : bossConfig_json_1.default.BossSpawns[ClassDef_1.reverseMapNames[globalmap]][boss_name].chance;
            // if spawn chance is 100 lets ignore the boss limits
            if (bossConfig_json_1.default.TotalBossesPerMap[ClassDef_1.reverseMapNames[globalmap]] === -1 ||
                spawnChance == 100) {
                // do nothing
            }
            else if (SWAG.bossCount.count >=
                bossConfig_json_1.default.TotalBossesPerMap[ClassDef_1.reverseMapNames[globalmap]]) {
                config_json_1.default.DebugOutput &&
                    logger.info("SWAG: Skipping boss spawn as total boss count has been met already");
                return;
            }
        }
        //read group and create wave from individual boss but same timing and location if RandomBossGroupBotZone is not null
        let wave = SWAG.ConfigureBossWave(boss, globalmap);
        locations[globalmap].base.BossLocationSpawn.push(wave);
    }
    static SpawnBots(group, globalmap, AlreadySpawnedGroups) {
        //check to see if OnlySpawnOnce is true, if so, check to see if group is already spawned
        if (group.OnlySpawnOnce && AlreadySpawnedGroups.includes(group)) {
            return;
        }
        AlreadySpawnedGroups.push(group);
        //read group and create wave from individual bots but same timing and location if StaticGroupBotZone is not null
        if (group.BotZone != null) {
            for (let zone of group.BotZone) {
                for (let bot of group.Bots) {
                    const wave = SWAG.ConfigureBotWave(group, bot, globalmap, zone);
                    locations[globalmap].base.waves.push(wave);
                }
            }
            // now we increment only AFTER all zones have been filled with the above group
            if (group.RandomTimeSpawn === false) {
                SWAG.incrementTime();
            }
        }
        else {
            let zone = null;
            for (let bot of group.Bots) {
                const wave = SWAG.ConfigureBotWave(group, bot, globalmap, zone);
                locations[globalmap].base.waves.push(wave);
            }
        }
    }
    static ConfigureBotWave(group, bot, globalmap, zone) {
        const isRandom = SWAG.isGroupRandom(group);
        let slots = 1;
        let player = false;
        let botType = ClassDef_1.roleCase[bot.BotType.toLowerCase()]
            ? ClassDef_1.roleCase[bot.BotType.toLowerCase()]
            : bot.BotType;
        let botCount = bot.MaxBotCount;
        let swagPMCconfig = config_json_1.default["SWAG_SPAWN_CONFIG-ONLY_USE_IF_NOT_USING_DONUTS_SPAWNS"].PMCs;
        let swagSCAVconfig = config_json_1.default["SWAG_SPAWN_CONFIG-ONLY_USE_IF_NOT_USING_DONUTS_SPAWNS"].SCAVs;
        if (group.OnlySpawnOnce === false && group.RandomTimeSpawn === false) {
            if (SWAG.waveCounter.count == 1) {
                SWAG.actual_timers.time_min = group.Time_min;
                SWAG.actual_timers.time_max = group.Time_max;
            }
        }
        else {
            SWAG.actual_timers.time_min = group.Time_min;
            SWAG.actual_timers.time_max = group.Time_max;
        }
        let roll = SWAG.getRandIntInclusive(1, 100);
        if (botType === "pmc" || botType === "sptUsec" || botType === "sptBear") {
            player = true;
            // check if requested botType is a PMC
            if (botType === "pmc") {
                // let's roll a random PMC type
                botType = ClassDef_1.pmcType[Math.floor(Math.random() * ClassDef_1.pmcType.length)];
            }
            // pmcWaves is false then we need to skip this PMC wave
            if (swagPMCconfig.pmcWaves === false) {
                slots = 0;
                botCount = 0;
            }
            // PMC weight check - let's not skip any Factory starting waves, so check for OnlySpawnOnce here
            else if (roll >= swagPMCconfig.pmcSpawnWeight &&
                group.OnlySpawnOnce === false) {
                slots = 0;
                botCount = 0;
            }
        }
        else if (botType === "assault") {
            if (swagSCAVconfig.scavWaves === false) {
                slots = 0;
                botCount = 0;
            }
            // If this is Labs, then don't allow SCAVs to spawn
            else if (globalmap === "laboratory" &&
                swagSCAVconfig.scavInLabs === false) {
                slots = 0;
                botCount = 0;
            }
            // SCAV weight check
            else if (roll >= swagSCAVconfig.scavSpawnWeight) {
                slots = 0;
                botCount = 0;
            }
        }
        else if (botType === "exUsec") {
            if (roll >= config_json_1.default.spawnChances.rogues[ClassDef_1.reverseMapNames[globalmap]]) {
                slots = 0;
                botCount = 0;
            }
        }
        else if (botType === "pmcBot") {
            if (roll >= config_json_1.default.spawnChances.raiders[ClassDef_1.reverseMapNames[globalmap]]) {
                slots = 0;
                botCount = 0;
            }
        }
        else if (botType === "arenaFighterEvent") {
            if (roll >= config_json_1.default.spawnChances.bloodhounds[ClassDef_1.reverseMapNames[globalmap]]) {
                slots = 0;
                botCount = 0;
            }
        }
        else if (botType === "crazyAssaultEvent") {
            if (roll >= config_json_1.default.spawnChances.crazyscavs[ClassDef_1.reverseMapNames[globalmap]]) {
                slots = 0;
                botCount = 0;
            }
        }
        // if botCount is 0, slots should always be 0
        if (botCount === 0) {
            slots = 0;
        }
        const wave = {
            number: null,
            WildSpawnType: botType,
            time_min: isRandom
                ? SWAG.randomWaveTimer.time_min
                : SWAG.actual_timers.time_min,
            time_max: isRandom
                ? SWAG.randomWaveTimer.time_max
                : SWAG.actual_timers.time_max,
            slots_min: slots,
            slots_max: Math.floor(botCount *
                ClassDef_1.aiAmountProper[config_json_1.default.SWAG_ONLY_aiAmount
                    ? config_json_1.default.SWAG_ONLY_aiAmount.toLowerCase()
                    : "asonline"]),
            BotPreset: ClassDef_1.diffProper[config_json_1.default.SWAG_ONLY_aiDifficulty.toLowerCase()],
            SpawnPoints: !!zone
                ? zone
                : SWAG.savedLocationData[globalmap].openZones &&
                    SWAG.savedLocationData[globalmap].openZones.length > 0
                    ? randomUtil.getStringArrayValue(SWAG.savedLocationData[globalmap].openZones)
                    : "",
            //set manually to Savage as supposedly corrects when bot data is requested
            BotSide: "Savage",
            //verify if its a pmcType and set isPlayers to true if it is
            isPlayers: player,
        };
        // If the wave has a random time, increment the wave timer counts
        if (isRandom) {
            //wave time increment is getting bigger each wave. Fix this by adding maxtimer to min timer
            SWAG.randomWaveTimer.time_min +=
                config_json_1.default.GlobalSCAVRandomWaveTimer.WaveTimerMaxSec;
            SWAG.randomWaveTimer.time_max +=
                config_json_1.default.GlobalSCAVRandomWaveTimer.WaveTimerMaxSec;
        }
        // increment fixed wave timers so that we have use different timed patterns
        // increment per map
        else if (group.OnlySpawnOnce === false) {
            SWAG.waveCounter.count += 2;
        }
        // config.DebugOutput &&
        // logger.info("SWAG: Configured Bot Wave: " + JSON.stringify(wave));
        return wave;
    }
    static ConfigureBossWave(boss, globalmap) {
        //read support bots if defined, set the difficulty to match config
        boss?.Supports?.forEach((escort) => {
            escort.BossEscortDifficult = [
                ClassDef_1.diffProper[config_json_1.default.SWAG_ONLY_aiDifficulty.toLowerCase()],
            ];
            escort.BossEscortType = ClassDef_1.roleCase[escort.BossEscortType.toLowerCase()];
        });
        //set bossWaveSpawnedOnceAlready to true if not already
        BossWaveSpawnedOnceAlready = true;
        // first check if BossChance is defined for this spawn
        let spawnChance = boss.BossChance ? boss.BossChance : 100;
        let spawnTime = -1;
        let spawnZones = null;
        let group_chance = boss.BossEscortAmount;
        let swagPMCconfig = config_json_1.default["SWAG_SPAWN_CONFIG-ONLY_USE_IF_NOT_USING_DONUTS_SPAWNS"].PMCs;
        let pmcChance = swagPMCconfig.pmcChance;
        let difficulty = ClassDef_1.diffProper[config_json_1.default.SWAG_ONLY_aiDifficulty.toLowerCase()];
        let escort_difficulty = ClassDef_1.diffProper[config_json_1.default.SWAG_ONLY_aiDifficulty.toLowerCase()];
        let bossName = ClassDef_1.roleCase[boss.BossName.toLowerCase()]
            ? ClassDef_1.roleCase[boss.BossName.toLowerCase()]
            : boss.BossName;
        let trigger_id = "";
        let trigger_name = "";
        let bossSettings = bossConfig_json_1.default.BossSpawns[ClassDef_1.reverseMapNames[globalmap]];
        let eventsBossSettings = eventsBossConfig_json_1.default.BossSpawns[ClassDef_1.reverseMapNames[globalmap]];
        switch (boss.BossName) {
            // Punisher Compatibility
            case "bosspunisher":
                if (bossConfig_json_1.default.CustomBosses.punisher) {
                    logger.info("SWAG: Custom Boss Punisher Compatibility Patch is ENABLED - Punisher spawn chance will be used from YOUR Punisher progress.json");
                    // get actual spawn chance from punisher progress file. thank you GrooveypenguinX!
                    const punisherBossProgressFilePath = path.resolve(__dirname, "../../PunisherBoss/src/progress.json");
                    difficulty = "impossible";
                    escort_difficulty = "impossible";
                    try {
                        const progressData = JSON.parse(fs.readFileSync(punisherBossProgressFilePath, "utf8"));
                        spawnChance = progressData?.actualPunisherChance ?? 1;
                    }
                    catch (error) {
                        logger.warning("SWAG: Unable to load Punisher Boss progress file, either you don't have the mod installed or you don't have a Punisher progress file yet.");
                        logger.warning("SWAG: Setting Punisher spawn chance to 1");
                        spawnChance = 1;
                    }
                }
                else {
                    logger.debug("SWAG: Detected bosspunisher, but Custom Boss flag is false - using SWAG spawn chance instead");
                }
                break;
            case "gifter":
                if (seasonalEvents.christmasEventEnabled()) {
                    spawnChance = eventsBossSettings.santa.chance;
                    spawnTime = eventsBossSettings.santa.time;
                    spawnZones = eventsBossSettings.santa.zone;
                    break;
                }
            case "bossboar":
                spawnChance = bossSettings.kaban.chance;
                spawnTime = bossSettings.kaban.time;
                spawnZones = bossSettings.kaban.zone;
                break;
            case "bosszryachiy":
                spawnChance = bossSettings.zryachiy.chance;
                spawnTime = bossSettings.zryachiy.time;
                spawnZones = bossSettings.zryachiy.zone;
                break;
            case "bossknight":
                spawnChance = bossSettings.goons.chance;
                spawnTime = bossSettings.goons.time;
                spawnZones = bossSettings.goons.zone;
                break;
            case "bosstagilla":
                spawnChance = bossSettings.tagilla.chance;
                spawnTime = bossSettings.tagilla.time;
                spawnZones = bossSettings.tagilla.zone;
                break;
            case "bossgluhar":
                spawnChance = bossSettings.glukhar.chance;
                spawnTime = bossSettings.glukhar.time;
                spawnZones = bossSettings.glukhar.zone;
                break;
            case "bosssanitar":
                spawnChance = bossSettings.sanitar.chance;
                spawnTime = bossSettings.sanitar.time;
                spawnZones = bossSettings.sanitar.zone;
                break;
            case "bosskojaniy":
                spawnChance = bossSettings.shturman.chance;
                spawnTime = bossSettings.shturman.time;
                spawnZones = bossSettings.shturman.zone;
                break;
            case "bossbully":
                spawnChance = bossSettings.reshala.chance;
                spawnTime = bossSettings.reshala.time;
                spawnZones = bossSettings.reshala.zone;
                break;
            case "bosskilla":
                spawnChance = bossSettings.killa.chance;
                spawnTime = bossSettings.killa.time;
                spawnZones = bossSettings.killa.zone;
                break;
            case "sectantpriest":
                spawnChance = config_json_1.default.spawnChances.cultists[ClassDef_1.reverseMapNames[globalmap]];
                break;
            case "pmcbot":
                spawnChance = boss.BossChance
                    ? boss.BossChance
                    : config_json_1.default.spawnChances.raiders[ClassDef_1.reverseMapNames[globalmap]];
                break;
            case "exusec":
                spawnChance = boss.BossChance
                    ? boss.BossChance
                    : config_json_1.default.spawnChances.rogues[ClassDef_1.reverseMapNames[globalmap]];
                break;
            case "bloodhound":
                spawnChance = boss.BossChance
                    ? boss.BossChance
                    : config_json_1.default.spawnChances.bloodhounds[ClassDef_1.reverseMapNames[globalmap]];
                break;
            case "crazyscavs":
                spawnChance = boss.BossChance
                    ? boss.BossChance
                    : config_json_1.default.spawnChances.crazyscavs[ClassDef_1.reverseMapNames[globalmap]];
                break;
            case "sptbear":
                spawnChance = boss.BossChance ? boss.BossChance : pmcChance;
                break;
            case "sptusec":
                spawnChance = boss.BossChance ? boss.BossChance : pmcChance;
                break;
            case "marksman":
                spawnChance = boss.BossChance
                    ? boss.BossChance
                    : config_json_1.default.spawnChances.snipers[ClassDef_1.reverseMapNames[globalmap]];
                break;
            case "assault":
                spawnChance = boss.BossChance ? boss.BossChance : 100;
                break;
            default:
                spawnChance = boss.BossChance
                    ? boss.BossChance
                    : bossConfig_json_1.default.BossSpawns[ClassDef_1.reverseMapNames[globalmap]][bossName].chance;
                spawnTime = boss.Time
                    ? boss.Time
                    : bossConfig_json_1.default.BossSpawns[ClassDef_1.reverseMapNames[globalmap]][bossName].time;
                spawnZones = boss.BossZone
                    ? boss.BossZone
                    : bossConfig_json_1.default.BossSpawns[ClassDef_1.reverseMapNames[globalmap]][bossName].chance;
                break;
        }
        // if it's null skip this part
        if (boss.BossZone != null || spawnZones != null) {
            spawnZones = boss.BossZone ? boss.BossZone : spawnZones;
            if (spawnZones.length > 1) {
                // let's just pick one zone, can't trust BSG to do this correctly
                let random_zone = SWAG.getRandIntInclusive(0, spawnZones.length - 1);
                spawnZones = spawnZones[random_zone];
            }
            // if it's not > 1 and not null, then we'll assume there's a single zone defined instead
            else {
                spawnZones = spawnZones[0];
            }
        }
        if (bossName === "sptUsec" || bossName === "sptBear") {
            group_chance = boss.BossEscortAmount
                ? boss.BossEscortAmount
                : SWAG.generatePmcGroupChance(swagPMCconfig.pmcGroupChance);
        }
        // if there's a trigger defined then we need to define it for this wave
        if (boss.TriggerId) {
            trigger_id = boss.TriggerId;
            trigger_name = boss.TriggerName;
        }
        const wave = {
            BossName: bossName,
            // If we are configuring a boss wave, we have already passed an internal check to add the wave based off the bossChance.
            // Set the bossChance to guarntee the added boss wave is spawned
            BossChance: spawnChance,
            BossZone: !!spawnZones
                ? spawnZones
                : SWAG.savedLocationData[globalmap].openZones &&
                    SWAG.savedLocationData[globalmap].openZones.length > 0
                    ? randomUtil.getStringArrayValue(SWAG.savedLocationData[globalmap].openZones)
                    : "",
            BossPlayer: false,
            BossDifficult: difficulty,
            BossEscortType: ClassDef_1.roleCase[boss.BossEscortType.toLowerCase()],
            BossEscortDifficult: escort_difficulty,
            BossEscortAmount: group_chance,
            Time: boss.Time ? boss.Time : spawnTime,
            Supports: boss.Supports,
            RandomTimeSpawn: boss.RandomTimeSpawn,
            TriggerId: trigger_id,
            TriggerName: trigger_name,
        };
        config_json_1.default.DebugOutput &&
            logger.warning("SWAG: Configured Boss Wave: " + JSON.stringify(wave));
        return wave;
    }
    // thanks ChatGPT
    static generatePmcGroupChance(group_chance, weights) {
        const defaultWeights = {
            asonline: [0.8, 0.12, 0.05, 0.03, 0],
            low: [0.9, 0.08, 0.02, 0, 0],
            none: [1, 0, 0, 0, 0],
            high: [0.1, 0.15, 0.3, 0.3, 0.15],
            max: [0, 0, 0.2, 0.5, 0.3],
        };
        const totalIntegers = Math.floor(Math.random() * 30) + 1; // Random length from 1 to 15 inclusive
        const selectedWeights = weights || defaultWeights[group_chance];
        let bossEscortAmount = [];
        for (let i = 0; i < selectedWeights.length; i++) {
            const count = Math.round(totalIntegers * selectedWeights[i]);
            bossEscortAmount.push(...Array(count).fill(i));
        }
        bossEscortAmount.sort((a, b) => a - b); // Sort the occurrences in ascending order
        // thank you DrakiaXYZ, you're a legend
        if (bossEscortAmount.length == 0) {
            bossEscortAmount.push(0);
        }
        return bossEscortAmount.join(",");
    }
    // thanks ChatGPT
    static shuffleArray(array) {
        const shuffledArray = [...array];
        for (let i = shuffledArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledArray[i], shuffledArray[j]] = [
                shuffledArray[j],
                shuffledArray[i],
            ];
        }
        return shuffledArray;
    }
    static incrementTime() {
        let min = SWAG.actual_timers.time_min;
        let max = SWAG.actual_timers.time_max;
        SWAG.actual_timers.time_min = max;
        SWAG.actual_timers.time_max = SWAG.actual_timers.time_min + (max - min);
    }
    static getRandIntInclusive(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    static disableSpawnSystems() {
        let map;
        for (map in locations) {
            if (map === "base" || map === "hideout") {
                continue;
            }
            locations[map].base.OfflineNewSpawn = false;
            locations[map].base.OfflineOldSpawn = true;
            locations[map].base.NewSpawn = false;
            locations[map].base.OldSpawn = true;
            config_json_1.default.DebugOutput &&
                logger.info("SWAG: disabled NewSpawnSystem to clear default spawns (SPT 3.6.x+)");
        }
    }
    static ClearDefaultSpawns() {
        let map;
        for (map in locations) {
            if (map === "base" || map === "hideout") {
                continue;
            }
            // Save a backup of the wave data and the BossLocationSpawn to use when restoring defaults on raid end. Store openzones in this data as well
            if (!SWAG.savedLocationData[map]) {
                const locationBase = locations[map].base;
                SWAG.savedLocationData[map] = {
                    waves: locationBase.waves,
                    BossLocationSpawn: locationBase.BossLocationSpawn,
                    openZones: this.GetOpenZones(map),
                };
            }
            // Reset Database, Cringe  -- i stole this code from LUA
            locations[map].base.waves = [...SWAG.savedLocationData[map].waves];
            locations[map].base.BossLocationSpawn = [
                ...SWAG.savedLocationData[map].BossLocationSpawn,
            ];
            //Clear bots spawn
            if (!config_json_1.default?.UseDefaultSpawns?.Waves) {
                locations[map].base.waves = [];
            }
            //Clear boss spawn
            const bossLocationSpawn = locations[map].base.BossLocationSpawn;
            if (!config_json_1.default?.UseDefaultSpawns?.Bosses &&
                !config_json_1.default?.UseDefaultSpawns?.TriggeredWaves) {
                locations[map].base.BossLocationSpawn = [];
            }
            else {
                // Remove Default Boss Spawns
                if (!config_json_1.default?.UseDefaultSpawns?.Bosses) {
                    for (let i = 0; i < bossLocationSpawn.length; i++) {
                        // Triggered wave check
                        if (bossLocationSpawn[i]?.TriggerName?.length === 0) {
                            locations[map].base.BossLocationSpawn.splice(i--, 1);
                        }
                    }
                }
                // Remove Default Triggered Waves
                if (!config_json_1.default?.UseDefaultSpawns?.TriggeredWaves) {
                    for (let i = 0; i < bossLocationSpawn.length; i++) {
                        // Triggered wave check
                        if (bossLocationSpawn[i]?.TriggerName?.length > 0) {
                            locations[map].base.BossLocationSpawn.splice(i--, 1);
                        }
                    }
                }
            }
        }
    }
}
module.exports = { mod: new SWAG() };
//# sourceMappingURL=SWAG.js.map