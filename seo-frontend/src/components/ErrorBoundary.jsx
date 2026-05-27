import React from "react";

export default class ErrorBoundary extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }

    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error, info) {

        console.error("React Crash:", error);
        console.error("Stack:", info);

        /* 🔥 OPTION TRACKING */
        // fetch("/api/log-error", {
        //     method: "POST",
        //     body: JSON.stringify({ error: error.toString(), info })
        // });
    }

    handleReload = () => {
        window.location.href = "/";
    };

    render() {

        if (this.state.hasError) {

            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">

                    <h1 className="text-2xl font-bold mb-2">
                        🚨 Une erreur est survenue
                    </h1>

                    <p className="text-gray-600 mb-6 max-w-md">
                        Notre équipe a été notifiée. Tu peux recharger la page ou revenir à l’accueil.
                    </p>

                    <div className="flex gap-3">

                        <button
                            onClick={() => window.location.reload()}
                            className="bg-indigo-600 text-white px-5 py-2 rounded-lg"
                        >
                            🔄 Recharger
                        </button>

                        <button
                            onClick={this.handleReload}
                            className="bg-gray-200 px-5 py-2 rounded-lg"
                        >
                            🏠 Accueil
                        </button>

                    </div>

                    {import.meta.env.DEV && (
                        <pre className="mt-6 p-4 bg-black text-green-400 text-xs rounded max-w-full overflow-auto">
                            {this.state.error?.toString()}
                        </pre>
                    )}

                </div>
            );
        }

        return this.props.children;
    }
}