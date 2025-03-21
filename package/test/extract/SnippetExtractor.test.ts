import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SnippetExtractor } from '../../src/extract/SnippetExtractor';
import path from 'path';
import fs from 'fs';

describe('SnippetExtractor', () => {
    const mockFilesPath = path.join(__dirname, '..', 'mock_snippet_files');
    const outputPath = path.join(mockFilesPath, 'output');

    // Helper function to safely remove directory
    const removeDirSafe = (dir: string) => {
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

    // Clean up output directory before and after each test
    beforeEach(() => {
        removeDirSafe(outputPath);
        fs.mkdirSync(outputPath, { recursive: true });
    });

    afterEach(() => {
        removeDirSafe(outputPath);
    });

    // Helper function to parse snippet content
    const parseSnippetContent = (content: string): string => {
        // Extract the string content from export default "..."
        const match = content.match(/export default "(.*?)";$/s);
        if (!match) return content;
        
        // Unescape the string content
        return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    };

    // Helper function to ensure output directory exists
    const ensureOutputDir = (dir: string) => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    };
    
    it('should extract a basic snippet', async () => {
        const config = {
            rootDirectory: path.join(mockFilesPath, 'snippets'),
            snippetOutputDirectory: outputPath,
            fileExtensions: ['.ts'],
            exclude: [],
            outputDirectoryStructure: 'byLanguage',
            snippetTags: {
                start: ':snippet-start:',
                end: ':snippet-end:',
                prependStart: ':prepend-start:',
                prependEnd: ':prepend-end:'
            }
        };

        ensureOutputDir(path.join(outputPath, 'typescript'));
        const extractor = new SnippetExtractor(config);
        await extractor.extractSnippets();

        // The snippet should be written to the output directory under typescript/
        const snippetPath = path.join(outputPath, 'typescript', 'basic-function.snippet.js');
        expect(fs.existsSync(snippetPath)).toBe(true);

        // Read the output file and verify its contents
        const snippetContent = parseSnippetContent(fs.readFileSync(snippetPath, 'utf-8'));
        expect(snippetContent).toContain('function add(a: number, b: number): number');
        expect(snippetContent).toContain('return a + b');
    });

    it('should extract multiple snippets from a single file', async () => {
        const config = {
            rootDirectory: path.join(mockFilesPath, 'snippets'),
            snippetOutputDirectory: outputPath,
            fileExtensions: ['.ts'],
            exclude: [],
            outputDirectoryStructure: 'byLanguage',
            snippetTags: {
                start: ':snippet-start:',
                end: ':snippet-end:',
                prependStart: ':prepend-start:',
                prependEnd: ':prepend-end:'
            }
        };

        ensureOutputDir(path.join(outputPath, 'typescript'));
        const extractor = new SnippetExtractor(config);
        await extractor.extractSnippets();

        // Check all three math snippets were extracted
        const snippets = ['math-add', 'math-subtract', 'math-multiply'];
        for (const snippet of snippets) {
            const snippetPath = path.join(outputPath, 'typescript', `${snippet}.snippet.js`);
            expect(fs.existsSync(snippetPath), `Snippet ${snippet} should exist`).toBe(true);
            
            const content = parseSnippetContent(fs.readFileSync(snippetPath, 'utf-8'));
            expect(content).toContain(`function ${snippet.split('-')[1]}`);
        }
    });

    it('should extract snippets from files with different extensions', async () => {
        const config = {
            rootDirectory: path.join(mockFilesPath, 'snippets'),
            snippetOutputDirectory: outputPath,
            fileExtensions: ['.js', '.xml', '.ts'],
            exclude: [],
            outputDirectoryStructure: 'byLanguage',
            snippetTags: {
                start: ':snippet-start:',
                end: ':snippet-end:',
                prependStart: ':prepend-start:',
                prependEnd: ':prepend-end:'
            }
        };

        // Ensure all required output directories exist
        ensureOutputDir(path.join(outputPath, 'js'));
        ensureOutputDir(path.join(outputPath, 'xml'));
        ensureOutputDir(path.join(outputPath, 'typescript'));

        const extractor = new SnippetExtractor(config);
        await extractor.extractSnippets();

        // Check JavaScript snippet
        const jsPath = path.join(outputPath, 'js', 'js-function.snippet.js');
        expect(fs.existsSync(jsPath)).toBe(true);
        const jsContent = parseSnippetContent(fs.readFileSync(jsPath, 'utf-8'));
        expect(jsContent).toContain('function jsFunction()');

        // Check XML snippet
        const xmlPath = path.join(outputPath, 'xml', 'xml-config.snippet.js');
        expect(fs.existsSync(xmlPath)).toBe(true);
        const xmlContent = parseSnippetContent(fs.readFileSync(xmlPath, 'utf-8'));
        expect(xmlContent).toContain('<config>');
    });

    it('should handle snippets with varying indentation levels', async () => {
        const config = {
            rootDirectory: path.join(mockFilesPath, 'snippets'),
            snippetOutputDirectory: outputPath,
            fileExtensions: ['.ts'],
            exclude: [],
            outputDirectoryStructure: 'byLanguage',
            snippetTags: {
                start: ':snippet-start:',
                end: ':snippet-end:',
                prependStart: ':prepend-start:',
                prependEnd: ':prepend-end:'
            }
        };

        ensureOutputDir(path.join(outputPath, 'typescript'));
        const extractor = new SnippetExtractor(config);
        await extractor.extractSnippets();

        // Check no-indent snippet
        const noIndentPath = path.join(outputPath, 'typescript', 'no-indent.snippet.js');
        expect(fs.existsSync(noIndentPath)).toBe(true);
        const rawContent = fs.readFileSync(noIndentPath, 'utf-8');
        console.log('Raw content:', rawContent); // Debug log
        const noIndentContent = parseSnippetContent(rawContent);
        console.log('Parsed content:', noIndentContent); // Debug log
        expect(noIndentContent).toContain('function noIndent(): void');
        expect(noIndentContent).toContain('console.log("No indentation")');

        // Check normal-indent snippet
        const normalIndentPath = path.join(outputPath, 'typescript', 'normal-indent.snippet.js');
        expect(fs.existsSync(normalIndentPath)).toBe(true);
        const normalIndentContent = parseSnippetContent(fs.readFileSync(normalIndentPath, 'utf-8'));
        expect(normalIndentContent).toContain('function normalIndent(): void');
        expect(normalIndentContent).toMatch(/console\.log\("Normal indentation"\)/);
        expect(normalIndentContent).toMatch(/if \(true\) {/);

        // Check whole-block-indent snippet
        const wholeBlockPath = path.join(outputPath, 'typescript', 'whole-block-indent.snippet.js');
        expect(fs.existsSync(wholeBlockPath)).toBe(true);
        const wholeBlockContent = parseSnippetContent(fs.readFileSync(wholeBlockPath, 'utf-8'));
        expect(wholeBlockContent).toContain('function wholeBlockIndent(): void');
        expect(wholeBlockContent).toMatch(/console\.log\("Everything indented"\)/);
        expect(wholeBlockContent).not.toMatch(/^    function/); // Should not have the original indentation
    });
});