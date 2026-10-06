import { readFile, writeFile } from "node:fs/promises";

export async function loadJSON<T>(
    path: string
): Promise<T | undefined> {
    try {
        const content = await readFile(path, "utf8");
        return JSON.parse(content) as T;
    } catch (error) {
        if (
            (error as NodeJS.ErrnoException).code === "ENOENT"
        ) {
            return undefined;
        }

        throw error;
    }
}

export async function saveJSON(
    path: string,
    data: unknown
): Promise<void> {
    await writeFile(
        path,
        JSON.stringify(data, null, 2),
        { mode: 0o600 }
    );
}