import { author, version } from "@shared/constants/general";
import type { FC } from "react";

interface IVersionCopyrightFooterProps {
    showCopyright?: boolean;
    showVersion?: boolean;
}

export const VersionCopyrightFooter: FC<IVersionCopyrightFooterProps> = ({
    showCopyright: showCopyright = false,
    showVersion: showVersion = true
}) => (
    <footer className="absolute bottom-0 left-0 mt-6 text-center text-xs italic opacity-50">
        {showVersion && <>Version {version}</>}
        {showVersion && showCopyright && " | "}
        {showCopyright && (
            <>
                Copyright &copy; 2025{" "}
                <a href="https://github.com/jonsilver" target="_blank" rel="noreferrer">
                    {author}
                </a>
            </>
        )}
    </footer>
);
