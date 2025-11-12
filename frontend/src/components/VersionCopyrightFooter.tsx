import type { FC } from "react";
import { author, version } from "../../package.json";

export const VersionCopyrightFooter: FC = () => (
    <footer className="absolute bottom-0 left-0 mt-6 text-center text-xs italic opacity-50">
        Version {version} | Copyright &copy; 2025{" "}
        <a href="https://github.com/jonsilver" target="_blank" rel="noreferrer">
            {author}
        </a>
    </footer>
);
