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
            error: error
        };
    }

    componentDidCatch(error, info) {
        console.error("React Crash:", error);
        console.error("Component Stack:", info);
    }

    render() {

        if (this.state.hasError) {
            return (
                <div style={{
                    padding: 40,
                    background: "black",
                    color: "red",
                    minHeight: "100vh"
                }}>
                    <h1>Erreur React détectée</h1>

                    <pre style={{
                        background: "#111",
                        padding: 20,
                        marginTop: 20,
                        color: "white"
                    }}>
                        {this.state.error?.toString()}
                    </pre>

                    <button
                        style={{
                            marginTop: 20,
                            padding: "10px 20px"
                        }}
                        onClick={() => window.location.reload()}
                    >
                        Recharger
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}