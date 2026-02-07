const calcularStats = async (model, field, match = {}) => {
    const statsAgg = await model.aggregate([
        {
            $match: {
                isDelete: false,
                ...match
            }
        },
        {
            $group: {
                _id: null,
                min: { $min: `$${field}`},
                max: { $max: `$${field}`},
                avg: { $avg: `$${field}`},
                all: { $push: `$${field}`}
            }
        }
    ]);
    if (!statsAgg[0]) return {};

    const all = statsAgg[0].all.sort((a,b) => a - b);
    const mid = Math.floor(all.length / 2);
    const media = all.length % 2 === 0 ? (all[mid - 1] + all[mid]) /2 : all[mid];

    return {
        min: statsAgg[0].min,
        max: statsAgg[0].max,
        avg: statsAgg[0].avg,
        media
    };  
};

module.exports = { calcularStats };