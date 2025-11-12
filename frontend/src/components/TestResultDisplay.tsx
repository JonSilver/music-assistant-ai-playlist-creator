import React from "react";

interface TestResult {
    success: boolean;
    error?: string;
}

interface TestResultDisplayProps {
    result: TestResult | undefined;
    successMessage: string;
    errorPrefix: string;
}

export const TestResultDisplay = ({
    result,
    successMessage,
    errorPrefix
}: TestResultDisplayProps): React.JSX.Element | null => {
    if (result === undefined) return null;

    return (
        <div className={`alert ${result.success ? "alert-success" : "alert-error"} mt-2`}>
            <span className="text-sm">
                {result.success
                    ? successMessage
                    : `${errorPrefix}: ${result.error ?? "Unknown error"}`}
            </span>
        </div>
    );
};
