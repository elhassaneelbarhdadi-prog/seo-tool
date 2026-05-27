import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { getNichesAI } from "../services/api";
import { formatNumber } from "../utils/format";

export default function EasyNiches({

    result,

    onSelect

}) {

    const navigate =
        useNavigate();

    const { lang } =
        useParams();

    const { t } =
        useTranslation();

    const currentLang =
        lang || "fr";

    const keyword =
        result?.keyword || "";

    const [

        loadingKeyword,

        setLoadingKeyword

    ] =
        useState(null);

    const [

        niches,

        setNiches

    ] =
        useState([]);

    const [

        loading,

        setLoading

    ] =
        useState(false);

    const [

        limited,

        setLimited

    ] =
        useState(false);

    /* ========================= */
    /* LOAD */
    /* ========================= */

    useEffect(() => {

        if (!keyword) {

            setNiches([]);

            return;

        }

        let mounted = true;

        const controller =
            new AbortController();

        const load = async () => {

            try {

                setLoading(true);

                setLimited(false);

                const data =

                    await getNichesAI(

                        keyword,

                        {

                            signal:
                                controller.signal

                        }

                    );

                if (
                    !mounted
                ) return;

                let list = [];

                if (
                    Array.isArray(
                        data
                    )
                ) {

                    list = data;

                }

                else if (

                    Array.isArray(
                        data?.niches
                    )

                ) {

                    list =
                        data.niches;

                }

                /* O(n) UNIQUE */

                const seen =
                    new Set();

                const unique =

                    list.filter(

                        item => {

                            const k =
                                item?.keyword;

                            if (
                                !k
                                ||
                                seen.has(k)
                            ) {

                                return false;

                            }

                            seen.add(k);

                            return true;

                        }

                    );

                setNiches(unique);

                setLimited(
                    !!data?.limited
                );

            }

            catch (err) {

                if (

                    err.name === "AbortError"

                    ||

                    controller.signal.aborted

                ) {

                    return;

                }

                console.error(

                    "NICHES:",

                    err.message

                );

                if (
                    mounted
                ) {

                    setNiches([]);

                }

            }

            finally {

                if (

                    mounted

                    &&

                    !controller.signal.aborted

                ) {

                    setLoading(false);

                }

            }

        };

        load();

        return () => {

            mounted = false;

            controller.abort();

        };

    }, [keyword]);

    /* ========================= */
    /* NAV */
    /* ========================= */

    const goToNichesPage = () => {

        navigate(

            `/${currentLang}/dashboard/niches`

        );

    };

    /* ========================= */
    /* UI */
    /* ========================= */

    return (

        <div
            className="
bg-white
shadow
rounded-2xl
p-6
mt-6
space-y-4
overflow-hidden
w-full
"
        >

            <div

                onClick={
                    goToNichesPage
                }

                className="

group
p-5
rounded-xl
cursor-pointer

bg-gradient-to-r

from-purple-600
to-indigo-600

text-white

hover:scale-[1.02]

transition

"

            >

                <p className="font-bold text-lg">

                    🚀 {t(
                        "find_profitable_niche"
                    )}

                </p>

                <p
                    className="
text-sm
text-purple-100
"
                >

                    {t(
                        "niche_subtitle"
                    )}

                </p>

            </div>

            {loading && (

                <p
                    className="
text-sm
text-gray-500
"
                >

                    ⏳ {t(
                        "loading_niches"
                    )}

                </p>

            )}

            {

                !loading
                &&
                niches.length === 0

                && (

                    <p
                        className="
text-sm
text-gray-400
"
                    >

                        {t(
                            "no_niches"
                        )}

                    </p>

                )

            }

            <div
                className="
grid
grid-cols-1
md:grid-cols-2
gap-3
"
            >

                {

                    niches.map(
                        n => {

                            const k =
                                n.keyword;

                            const volume =
                                Number(
                                    n.volume
                                );

                            return (

                                <button

                                    key={k}

                                    disabled={
                                        loadingKeyword === k
                                    }

                                    onClick={async () => {

                                        if (
                                            loadingKeyword
                                        )
                                            return;

                                        setLoadingKeyword(k);

                                        try {

                                            await onSelect(
                                                k
                                            );

                                        }
                                        catch (err) {

                                            console.error(

                                                "SELECT:",

                                                err.message

                                            );

                                        }
                                        finally {

                                            setLoadingKeyword(
                                                null
                                            );

                                        }

                                    }}

                                    className={`

p-4

rounded-xl

border

text-left

transition

flex

flex-col

gap-1

${loadingKeyword === k

                                            ?

                                            "bg-gray-100 cursor-not-allowed"

                                            :

                                            "bg-white hover:border-indigo-400 hover:shadow-sm"

                                        }

`}

                                >

                                    <p
                                        className="
font-semibold
text-gray-800
break-words
"
                                    >

                                        {k}

                                    </p>

                                    {!Number.isNaN(
                                        volume
                                    ) && (

                                            <p
                                                className="
text-xs
text-gray-500
"
                                            >

                                                {formatNumber(
                                                    volume
                                                )}

                                                {" "}
                                                recherches/mois

                                            </p>

                                        )}

                                    {

                                        loadingKeyword === k

                                        && (

                                            <p
                                                className="
text-xs
text-gray-400
"
                                            >

                                                ⏳ Analyse...

                                            </p>

                                        )

                                    }

                                </button>

                            );

                        })

                }

            </div>

            {

                limited

                && (

                    <div
                        className="
text-sm
text-orange-500
mt-2
"
                    >

                        🔒 {t(
                            "limited_niches"
                        )}

                    </div>

                )

            }

        </div>

    );

}