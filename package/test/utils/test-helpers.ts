/**
 * Test-specific helper functions for SnippetExtractor tests
 * 
 * Note: These utilities are specifically for testing purposes and don't have
 * equivalents in the main SnippetExtractor implementation because they serve
 * test-only purposes.
 */

import fs from 'fs';
import path from 'path';

/**
 * Test-specific utility: Parses the output format of snippet files
 * This helper exists only in tests because the main implementation writes files
 * but never needs to parse them back.
 */
export const parseSnippetContent = (content: string): string => {
    // Extract the string content from export default "..."
    const match = content.match(/export default "(.*?)";$/s);
    if (!match) return content;
    
    // Unescape the string content
    return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
};

/**
 * Test-specific utility: Creates standardized test configurations
 * This helper exists only in tests to provide consistent test setup.
 * The main implementation expects configs to be provided by users.
 */
export const createTestConfig = (options: {
    rootDirectory: string,
    snippetOutputDirectory: string,
    fileExtensions?: string[],
    exclude?: string[],
    outputDirectoryStructure?: string
}) => {
    return {
        rootDirectory: options.rootDirectory,
        snippetOutputDirectory: options.snippetOutputDirectory,
        fileExtensions: options.fileExtensions || ['.ts'],
        exclude: options.exclude || [],
        outputDirectoryStructure: options.outputDirectoryStructure || 'byLanguage',
        snippetTags: {
            start: ':snippet-start:',
            end: ':snippet-end:',
            prependStart: ':prepend-start:',
            prependEnd: ':prepend-end:'
        }
    };
};

/**
 * Directory cleanup utility for tests
 * Similar to SnippetExtractor's ensureDirectoryExists but focused on
 * test cleanup rather than production directory creation.
 */
export const removeDirSafe = (dir: string) => {
    try {
        if (fs.existsSync(dir)) {
            // First, remove all files in the directory
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                if (fs.lstatSync(filePath).isDirectory()) {
                    removeDirSafe(filePath);
                } else {
                    fs.unlinkSync(filePath);
                }
            }
            // Then remove the directory itself
            fs.rmdirSync(dir);
        }
    } catch (err) {
        console.error(`Error removing directory ${dir}:`, err);
    }
};