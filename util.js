// function getRandomValue(array) {
// }
// function doSomeHeavyTask() {
//     const ms = getRandomValue([1000, 2000, 3000, 4000, 5000]);
//     const shouldThrowError = getRandomValue([1, 2, 3, 4, 5, 6,7,8]) === 8;
//     if (shouldThrowError) {
//         const randomError = getRandomValue([
//             "DB payment failed",
//             "DB connection failed",
//             "DB query failed",
//             "Access denied",
//             "Not found Error",
//         ]);
//         throw new Error(randomError);
//     }
//     return new Promise((resolve) => {
//         setTimeout(() => {
//             resolve(ms);
//         }, ms)
//     });
// }
// module.exports = { doSomeHeavyTask };

const doSomeHeavyTask = () => {
    return new Promise((resolve) => {
        const time = 2000;

        setTimeout(() => {
            resolve(time);
        }, time);
    });
};

module.exports = {
    doSomeHeavyTask
};