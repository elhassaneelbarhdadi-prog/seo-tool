export const estimateSEO = (
    keyword = ""
) => {

    if (!keyword?.trim()) {
        return null;
    }

    const clean =
        keyword
            .toLowerCase()
            .trim();

    const words =
        clean
            .split(/\s+/)
            .length;

    /* ========================= */
    /* INTENT */
    /* ========================= */

    const transactional =

        /acheter|prix|promo|comparatif|pas cher/i
            .test(clean);

    const informational =

        /comment|guide|astuce|pourquoi/i
            .test(clean);

    /* ========================= */
    /* VOLUME ESTIMÉ */
    /* ========================= */

    let estimatedVolume;

    if (words <= 2) {

        estimatedVolume = 15000;

    }

    else if (words === 3) {

        estimatedVolume = 6000;

    }

    else {

        estimatedVolume = 2000;

    }

    /* ========================= */
    /* CPC ESTIMÉ */
    /* ========================= */

    let estimatedCpc = 0.20;

    if (transactional) {

        estimatedCpc += 1;

    }

    if (informational) {

        estimatedCpc += 0.20;

    }

    estimatedCpc =
        Number(
            estimatedCpc.toFixed(2)
        );

    /* ========================= */
    /* DIFFICULTÉ */
    /* ========================= */

    let difficulty = 20;

    if (words <= 2) {

        difficulty += 40;

    }

    if (words >= 4) {

        difficulty -= 10;

    }

    if (transactional) {

        difficulty += 10;

    }

    difficulty = Math.max(

        5,

        Math.min(
            95,
            difficulty
        )

    );

    /* ========================= */
    /* CONCURRENCE */
    /* ========================= */

    const competition =

        difficulty > 70
            ? "élevée"

            : difficulty > 40

                ? "modérée"

                : "faible";

    /* ========================= */
    /* REVENUE ESTIMÉ */
    /* ========================= */

    const estimatedRevenue =

        Math.round(

            estimatedVolume *

            estimatedCpc *

            0.2

        );

    /* ========================= */
    /* SCORE */
    /* ========================= */

    const opportunity =

        (
            estimatedVolume *
            estimatedCpc
        ) /

        (difficulty || 1);

    const score =

        Math.max(

            1,

            Math.min(

                100,

                Math.round(
                    opportunity / 50
                )

            )

        );

    return {

        estimatedVolume,

        estimatedCpc,

        estimatedRevenue,

        competition,

        difficulty,

        score,

        source:
            "estimated"

    };

};