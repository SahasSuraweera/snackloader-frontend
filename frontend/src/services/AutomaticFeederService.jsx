// AutomaticFeederService.jsx
import { useEffect, useState, useCallback } from "react";
import { auth, db, rtdb } from "../services/firebase";
import { doc, onSnapshot, updateDoc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, set, onValue } from "firebase/database";

const AutomaticFeederService = () => {
    const [settings, setSettings] = useState(null);
    const [lastChecked, setLastChecked] = useState({});
    const [temperature, setTemperature] = useState(null);
    const [humidity, setHumidity] = useState(null);
    const [tempAdapt, setTempAdapt] = useState(false);
    const [catBowl, setCatBowl] = useState(0);
    const [dogBowl, setDogBowl] = useState(0);
    const [currentDate, setCurrentDate] = useState("");

    // Update current date every second (for daily intake tracking)
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentDate(now.toISOString().split('T')[0]); // "YYYY-MM-DD" format
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);

        return () => clearInterval(interval);
    }, []);

    // ---------------------------------------------------
    // DAILY INTAKE TRACKING FUNCTIONS
    // ---------------------------------------------------
    const updateDailyIntake = useCallback(async (pet, userAmount) => {
        try {
            const user = auth.currentUser;
            if (!user || !currentDate) return;

            const dailyIntakeRef = doc(db, "dailyIntake", currentDate);

            const dailySnap = await getDoc(dailyIntakeRef);

            if (dailySnap.exists()) {
                const currentData = dailySnap.data();
                const currentTotal = currentData[pet]?.totalDispensed || 0;

                await updateDoc(dailyIntakeRef, {
                    [`${pet}.totalDispensed`]: currentTotal + Number(userAmount),
                    lastUpdated: serverTimestamp()
                });
            } else {
                const initialData = {
                    date: currentDate,
                    cat: { totalDispensed: 0, currentBowlWeight: 0, calculatedIntake: 0 },
                    dog: { totalDispensed: 0, currentBowlWeight: 0, calculatedIntake: 0 },
                    lastUpdated: serverTimestamp()
                };

                initialData[pet].totalDispensed = Number(userAmount);
                await setDoc(dailyIntakeRef, initialData);
            }

            console.log(`📊 Daily intake updated: ${pet} +${userAmount}g`);
        } catch (error) {
            console.error("Error updating daily intake:", error);
        }
    }, [currentDate]);

    const calculateDailyIntake = useCallback(async () => {
        try {
            const user = auth.currentUser;
            if (!user || !currentDate) return;

            const dailyIntakeRef = doc(db, "dailyIntake", currentDate);
            const dailySnap = await getDoc(dailyIntakeRef);

            if (dailySnap.exists()) {
                const currentData = dailySnap.data();

                const catIntake = Math.max(0, (currentData.cat?.totalDispensed || 0) - catBowl);
                const dogIntake = Math.max(0, (currentData.dog?.totalDispensed || 0) - dogBowl);

                await updateDoc(dailyIntakeRef, {
                    'cat.currentBowlWeight': catBowl,
                    'cat.calculatedIntake': catIntake,
                    'dog.currentBowlWeight': dogBowl,
                    'dog.calculatedIntake': dogIntake,
                    lastUpdated: serverTimestamp()
                });

                console.log(`📈 Daily intake calculated - Cat: ${catIntake}g, Dog: ${dogIntake}g`);
            }
        } catch (error) {
            console.error("Error calculating daily intake:", error);
        }
    }, [currentDate, catBowl, dogBowl]);

    // ---------------------------------------------------
    // WEATHER / THI FUNCTIONS
    // ---------------------------------------------------
    const getAdaptedAmount = useCallback((base) => {
        const num = Number(base);
        if (!tempAdapt) return num;

        if (temperature === null || humidity === null) return num;

        const getTHI = (t, h) => {
            if (!t || !h) return null;
            const dew = t - (100 - h) / 5;
            return t + 0.36 * dew + 41.2;
        };

        const thi = getTHI(temperature, humidity);
        if (!thi || isNaN(thi)) return num;

        let adapted = num;

        if (thi < 70) adapted = Math.round(num * 1.10);
        else if (thi <= 75) adapted = num;
        else if (thi <= 80) adapted = Math.round(num * 0.90);
        else if (thi <= 85) adapted = Math.round(num * 0.80);
        else adapted = 0;

        if (Math.abs(adapted - num) < 5) {
            return num;
        }

        return adapted;
    }, [tempAdapt, temperature, humidity]);

    // ---------------------------------------------------
    // AUTOMATIC FEEDING LOGIC - EXACTLY MATCHES MANUALFEED
    // ---------------------------------------------------
    const triggerAutomaticFeed = useCallback(async (pet, amount, scheduleTime) => {
        const adjusted = getAdaptedAmount(amount);
        const bowlWeight = pet === "cat" ? catBowl : dogBowl;

        // THI danger check
        if (adjusted === 0 && tempAdapt) {
            console.log(`⚠️ Automatic feeding blocked for ${pet} at ${scheduleTime} due to dangerous heat (THI).`);
            return;
        }

        // Bowl check - if bowl has enough or more, skip feeding
        if (bowlWeight >= adjusted) {
            console.log(`${pet.toUpperCase()} bowl already has ${bowlWeight}g. Automatic feeding skipped for ${scheduleTime}.`);
            return;
        }

        const finalAmount = adjusted;

        try {
            console.log(`🔄 Automatic feeding: ${pet} ${finalAmount}g at ${scheduleTime}`);

            // ✅ EXACT SAME LOGIC AS MANUALFEED:
            const currentTime = Date.now();
            await set(ref(rtdb, `dispenser/${pet}/status`), "completed");
            await set(ref(rtdb, `dispenser/${pet}/lastFed`), currentTime);
            await set(ref(rtdb, `dispenser/${pet}/amount`), Number(finalAmount));
            await set(ref(rtdb, `dispenser/${pet}/run`), true);

            await updateDailyIntake(pet, amount);

            console.log(`✅ Automatic feeding triggered: ${pet} ${finalAmount}g at ${scheduleTime}`);
        } catch (error) {
            console.error(`❌ Automatic feeding failed for ${pet} at ${scheduleTime}:`, error);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getAdaptedAmount, catBowl, dogBowl, tempAdapt]);

    // ---------------------------------------------------
    // SCHEDULE CHECKING WITH PRECISE TIMESTAMP
    // ---------------------------------------------------
    const checkSchedules = useCallback(() => {
        if (!settings || !settings.autoFeedEnabled) return;

        const now = new Date();
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        const timeNow = `${hh}:${mm}`;
        const today = now.toDateString();

        console.log(`🕒 Current time: ${timeNow}, AutoFeed: ${settings.autoFeedEnabled}`);

        // CAT
        settings.cat?.schedule?.forEach(schedule => {
            const scheduleKey = `cat_${schedule.time}_${today}`;

            console.log(`🐱 Comparing: "${schedule.time}" with "${timeNow}"`);

            if (schedule.time === timeNow) {
                console.log(`✅ Cat schedule match found!`);
                if (!lastChecked[scheduleKey]) {
                    console.log(`🚀 Triggering cat feeding for ${schedule.amount}g`);
                    triggerAutomaticFeed("cat", schedule.amount, schedule.time);
                    setLastChecked(prev => ({ ...prev, [scheduleKey]: true }));
                } else {
                    console.log(`⏭️ Cat feeding already processed today`);
                }
            }
        });

        // DOG
        settings.dog?.schedule?.forEach(schedule => {
            const scheduleKey = `dog_${schedule.time}_${today}`;

            console.log(`🐶 Comparing: "${schedule.time}" with "${timeNow}"`);

            if (schedule.time === timeNow) {
                console.log(`✅ Dog schedule match found!`);
                if (!lastChecked[scheduleKey]) {
                    console.log(`🚀 Triggering dog feeding for ${schedule.amount}g`);
                    triggerAutomaticFeed("dog", schedule.amount, schedule.time);
                    setLastChecked(prev => ({ ...prev, [scheduleKey]: true }));
                } else {
                    console.log(`⏭️ Dog feeding already processed today`);
                }
            }
        });

    }, [settings, lastChecked, triggerAutomaticFeed]);

    // ---------------------------------------------------
    // FIREBASE SUBSCRIPTIONS
    // ---------------------------------------------------
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        // Subscribe to Firestore settings
        const settingsRef = doc(db, "feederSettings", user.uid);
        const unsubscribeSettings = onSnapshot(settingsRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                console.log("📋 AutomaticFeederService loaded settings:", data);
                setSettings(data);
            } else {
                console.log("❌ No settings found in Firestore");
            }
        });

        // Subscribe to Realtime Database for environment data
        const unsubTH = onValue(ref(rtdb, "temperature"), snap => {
            const data = snap.val();
            if (data) {
                setTemperature(data.temperature ?? null);
                setHumidity(data.humidity ?? null);
            }
        });

        const unsubAdapt = onValue(ref(rtdb, "settings/tempAdapt"), snap =>
            setTempAdapt(Boolean(snap.val()))
        );

        const unsubCatBowl = onValue(
            ref(rtdb, "petfeeder/cat/bowlWeight/weight"),
            snap => setCatBowl(Number(snap.val() || 0))
        );

        const unsubDogBowl = onValue(
            ref(rtdb, "petfeeder/dog/bowlWeight/weight"),
            snap => setDogBowl(Number(snap.val() || 0))
        );

        return () => {
            unsubscribeSettings();
            unsubTH();
            unsubAdapt();
            unsubCatBowl();
            unsubDogBowl();
        };
    }, []);

    // ---------------------------------------------------
    // SCHEDULE CHECKING - EVERY SECOND
    // ---------------------------------------------------
    useEffect(() => {
        const interval = setInterval(checkSchedules, 1000);
        return () => clearInterval(interval);
    }, [checkSchedules]);

    // ---------------------------------------------------
    // DAILY MIDNIGHT CALCULATIONS
    // ---------------------------------------------------
    useEffect(() => {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const timeUntilMidnight = midnight - now;

        const midnightTimeout = setTimeout(() => {
            calculateDailyIntake();
            setLastChecked({});
            console.log("🔄 Daily reset: intake calculated and counters reset");
        }, timeUntilMidnight);

        return () => clearTimeout(midnightTimeout);
    }, [calculateDailyIntake]);

    // This component doesn't render anything
    return null;
};

export default AutomaticFeederService;