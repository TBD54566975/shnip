import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SnippetExtractor } from '../../src/extract/SnippetExtractor';
import { removeDirSafe, parseSnippetContent, createTestConfig } from '../utils/test-helpers';
import path from 'path';
import fs from 'fs';

describe('SnippetExtractor', () => {
    const mockFilesPath = path.join(__dirname, '..', 'mock_snippet_files');
    const outputPath = path.join(mockFilesPath, 'output');

    // Clean up output directory before and after each test
    beforeEach(() => {
        removeDirSafe(outputPath);
        fs.mkdirSync(outputPath, { recursive: true });
    });

    afterEach(() => {
        removeDirSafe(outputPath);
    });

    /***********************************************
     * Basic Snippet Extraction
     ***********************************************/
    
    it('should extract a basic snippet', async () => {
        const config = createTestConfig({
            rootDirectory: path.join(mockFilesPath, 'snippets'),
            snippetOutputDirectory: outputPath
        });

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
        const config = createTestConfig({
            rootDirectory: path.join(mockFilesPath, 'snippets'),
            snippetOutputDirectory: outputPath
        });

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
        const config = createTestConfig({
            rootDirectory: path.join(mockFilesPath, 'snippets'),
            snippetOutputDirectory: outputPath,
            fileExtensions: ['.js', '.xml', '.ts']
        });

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
        const config = createTestConfig({
            rootDirectory: path.join(mockFilesPath, 'snippets'),
            snippetOutputDirectory: outputPath
        });

        const extractor = new SnippetExtractor(config);
        await extractor.extractSnippets();

        // Check no-indent snippet
        const noIndentPath = path.join(outputPath, 'typescript', 'no-indent.snippet.js');
        expect(fs.existsSync(noIndentPath)).toBe(true);
        const rawContent = fs.readFileSync(noIndentPath, 'utf-8');
        console.log('Raw content:', rawContent);
        const noIndentContent = parseSnippetContent(rawContent);
        console.log('Parsed content:', noIndentContent);
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
        expect(wholeBlockContent).not.toMatch(/^    function/);
    });

    /***********************************************
     * Prepend Block Functionality
     ***********************************************/

    it('should extract a snippet with a single prepend block', async () => {
        const config = createTestConfig({
            rootDirectory: path.join(mockFilesPath, 'snippets'),
            snippetOutputDirectory: outputPath
        });

        const extractor = new SnippetExtractor(config);
        await extractor.extractSnippets();

        // Check the user-service snippet
        const snippetPath = path.join(outputPath, 'typescript', 'user-service.snippet.js');
        expect(fs.existsSync(snippetPath)).toBe(true);

        const content = parseSnippetContent(fs.readFileSync(snippetPath, 'utf-8'));
        
        // Check that imports from prepend block appear first
        expect(content).toMatch(/^import.*Database.*\n/);
        expect(content).toMatch(/^import.*User.*\n/m);

        // Check that the main snippet content follows
        expect(content).toContain('export class UserService');
        expect(content).toContain('findUserById');

        // Verify order: imports should come before class definition
        const importIndex = content.indexOf('import');
        const classIndex = content.indexOf('export class');
        expect(importIndex).toBeLessThan(classIndex);
    });

    it('should extract a snippet with multiple prepend blocks', async () => {
        const config = createTestConfig({
            rootDirectory: path.join(mockFilesPath, 'snippets'),
            snippetOutputDirectory: outputPath
        });

        const extractor = new SnippetExtractor(config);
        await extractor.extractSnippets();

        // Check the complex-service snippet
        const snippetPath = path.join(outputPath, 'typescript', 'complex-service.snippet.js');
        expect(fs.existsSync(snippetPath)).toBe(true);

        const content = parseSnippetContent(fs.readFileSync(snippetPath, 'utf-8'));
        
        // Check that all imports from both prepend blocks are present
        expect(content).toContain('import { Database } from');
        expect(content).toContain('import { Logger } from');
        expect(content).toContain('import { Config } from');
        expect(content).toContain('import { Metrics } from');

        // Check that the main snippet content is present
        expect(content).toContain('export class ComplexService');
        expect(content).toContain('processData');

        // Verify all imports come before the class definition
        const lastImportIndex = Math.max(
            content.lastIndexOf('import'),
            0
        );
        const classIndex = content.indexOf('export class');
        expect(lastImportIndex).toBeLessThan(classIndex);

        // Verify the service uses all the imported dependencies
        expect(content).toContain('private db: Database');
        expect(content).toContain('private logger: Logger');
        expect(content).toContain('private metrics: Metrics');
        expect(content).toContain('private config: Config');
    });

    it('should extract multiple snippets with their respective prepend blocks', async () => {
        const config = createTestConfig({
            rootDirectory: path.join(mockFilesPath, 'snippets'),
            snippetOutputDirectory: outputPath
        });

        const extractor = new SnippetExtractor(config);
        await extractor.extractSnippets();

        // Check user repository snippet
        const userPath = path.join(outputPath, 'typescript', 'user-repository.snippet.js');
        expect(fs.existsSync(userPath)).toBe(true);
        const userContent = parseSnippetContent(fs.readFileSync(userPath, 'utf-8'));

        // Verify user repository imports and content
        expect(userContent).toContain('import { Database } from');
        expect(userContent).toContain('import { User } from');
        expect(userContent).toContain('export class UserRepository');
        expect(userContent).not.toContain('PostValidator');

        // Check post repository snippet
        const postPath = path.join(outputPath, 'typescript', 'post-repository.snippet.js');
        expect(fs.existsSync(postPath)).toBe(true);
        const postContent = parseSnippetContent(fs.readFileSync(postPath, 'utf-8'));

        // Verify post repository imports and content
        expect(postContent).toContain('import { Database } from');
        expect(postContent).toContain('import { Post } from');
        expect(postContent).toContain('import { PostValidator } from');
        expect(postContent).toContain('export class PostRepository');
        expect(postContent).not.toContain('User');
    });

    it('should handle missing prepend blocks gracefully', async () => {
        const config = createTestConfig({
            rootDirectory: path.join(mockFilesPath, 'snippets'),
            snippetOutputDirectory: outputPath
        });

        const extractor = new SnippetExtractor(config);
        await extractor.extractSnippets();

        // Check the snippet that references a non-existent prepend block
        const snippetPath = path.join(outputPath, 'typescript', 'missing-prepend.snippet.js');
        expect(fs.existsSync(snippetPath)).toBe(true);
        const content = parseSnippetContent(fs.readFileSync(snippetPath, 'utf-8'));

        // Should still contain the main content
        expect(content).toContain('export function functionWithMissingPrepend');
        // Should not throw an error or include undefined content
        expect(content).not.toContain('undefined');
        expect(content.trim()).toBe('export function functionWithMissingPrepend() {\n    console.log("This snippet references a prepend block that doesn\'t exist");\n}');
    });

    it('should handle orphaned prepend blocks (no corresponding snippets)', async () => {
        const config = createTestConfig({
            rootDirectory: path.join(mockFilesPath, 'snippets'),
            snippetOutputDirectory: outputPath
        });

        const extractor = new SnippetExtractor(config);
        await extractor.extractSnippets();

        // Check that the snippet with a proper prepend block is extracted correctly
        const existingPath = path.join(outputPath, 'typescript', 'existing-prepend.snippet.js');
        expect(fs.existsSync(existingPath)).toBe(true);
        const existingContent = parseSnippetContent(fs.readFileSync(existingPath, 'utf-8'));

        // Should contain its prepend content
        expect(existingContent).toContain('import { Something } from');
        expect(existingContent).toContain('export function functionWithPrepend');

        // The orphaned prepend content should not create a file
        const orphanedPath = path.join(outputPath, 'typescript', 'orphaned-prepend.snippet.js');
        expect(fs.existsSync(orphanedPath)).toBe(false);

        // Verify the existing content doesn't include the orphaned prepend
        expect(existingContent).not.toContain('NeverUsed');
    });

    /***********************************************
     * Configuration Testing
     ***********************************************/

    it('should respect file extension filters', async () => {
        // First test: only process .py files
        const pythonConfig = createTestConfig({
            rootDirectory: path.join(mockFilesPath, 'snippets'),
            snippetOutputDirectory: outputPath,
            fileExtensions: ['.py']
        });

        let extractor = new SnippetExtractor(pythonConfig);
        await extractor.extractSnippets();

        // Should extract all snippets from .py file
        const pythonPath = path.join(outputPath, 'other', 'python-style.snippet.js');
        const rubyFromPyPath = path.join(outputPath, 'other', 'ruby-style.snippet.js');
        const tsFromPyPath = path.join(outputPath, 'other', 'typescript-style.snippet.js');
        
        // All snippets from .py file should be extracted
        expect(fs.existsSync(pythonPath)).toBe(true);
        expect(fs.existsSync(rubyFromPyPath)).toBe(true);
        expect(fs.existsSync(tsFromPyPath)).toBe(true);

        // Should not extract from .rb file (wrong extension)
        const rubyPath = path.join(outputPath, 'other', 'ruby-function.snippet.js');
        expect(fs.existsSync(rubyPath)).toBe(false);

        // Clean up for second test
        removeDirSafe(outputPath);
        fs.mkdirSync(outputPath, { recursive: true });

        // Second test: process both .py and .rb files
        const mixedConfig = createTestConfig({
            rootDirectory: path.join(mockFilesPath, 'snippets'),
            snippetOutputDirectory: outputPath,
            fileExtensions: ['.py', '.rb']
        });

        extractor = new SnippetExtractor(mixedConfig);
        await extractor.extractSnippets();

        // Should extract from both file types
        expect(fs.existsSync(pythonPath)).toBe(true);
        expect(fs.existsSync(rubyPath)).toBe(true);

        // Verify content is extracted correctly
        const pythonContent = parseSnippetContent(fs.readFileSync(pythonPath, 'utf-8'));
        expect(pythonContent).toContain('def calculate_sum');

        const rubyContent = parseSnippetContent(fs.readFileSync(rubyPath, 'utf-8'));
        expect(rubyContent).toContain('def hello_world');

        // Verify all snippets from .py file are still extracted
        const tsContent = parseSnippetContent(fs.readFileSync(tsFromPyPath, 'utf-8'));
        expect(tsContent).toContain('function divide');
    });

    it('should handle custom snippet tag configurations', async () => {
        // Test JSDoc-style tags
        const jsdocConfig = createTestConfig({
            rootDirectory: path.join(mockFilesPath, 'snippets'),
            snippetOutputDirectory: outputPath,
            fileExtensions: ['.ts']
        });
        jsdocConfig.snippetTags = {
            start: '/* @snippet-begin:',
            end: '/* @snippet-end */',
            prependStart: '/* @prepend-begin:',
            prependEnd: '/* @prepend-end */'
        };

        let extractor = new SnippetExtractor(jsdocConfig);
        await extractor.extractSnippets();

        // Check JSDoc-style tagged snippet
        const jsdocPath = path.join(outputPath, 'typescript', 'custom-tagged-function.snippet.js');
        expect(fs.existsSync(jsdocPath)).toBe(true);
        let content = parseSnippetContent(fs.readFileSync(jsdocPath, 'utf-8'));
        expect(content).toContain('function customTagged');
        
        // Verify default tags are not picked up
        const ignoredPath = path.join(outputPath, 'typescript', 'ignored-function.snippet.js');
        expect(fs.existsSync(ignoredPath)).toBe(false);

        // Clean up for next test
        removeDirSafe(outputPath);
        fs.mkdirSync(outputPath, { recursive: true });

        // Test region-style tags
        const regionConfig = createTestConfig({
            rootDirectory: path.join(mockFilesPath, 'snippets'),
            snippetOutputDirectory: outputPath,
            fileExtensions: ['.ts']
        });
        regionConfig.snippetTags = {
            start: '// #region snippet:',
            end: '// #endregion',
            prependStart: '// #region prepend:',
            prependEnd: '// #endregion'
        };

        extractor = new SnippetExtractor(regionConfig);
        await extractor.extractSnippets();

        // Check region-style tagged snippet
        const regionPath = path.join(outputPath, 'typescript', 'region-style.snippet.js');
        expect(fs.existsSync(regionPath)).toBe(true);
        content = parseSnippetContent(fs.readFileSync(regionPath, 'utf-8'));
        expect(content).toContain('function regionStyleFunction');

        // Clean up for next test
        removeDirSafe(outputPath);
        fs.mkdirSync(outputPath, { recursive: true });

        // Test bracket-style tags
        const bracketConfig = createTestConfig({
            rootDirectory: path.join(mockFilesPath, 'snippets'),
            snippetOutputDirectory: outputPath,
            fileExtensions: ['.ts']
        });
        bracketConfig.snippetTags = {
            start: '/* [snippet:start]',
            end: '/* [snippet:end] */',
            prependStart: '/* [prepend:start]',
            prependEnd: '/* [prepend:end] */'
        };

        extractor = new SnippetExtractor(bracketConfig);
        await extractor.extractSnippets();

        // Check bracket-style tagged snippet
        const bracketPath = path.join(outputPath, 'typescript', 'bracket-style.snippet.js');
        expect(fs.existsSync(bracketPath)).toBe(true);
        content = parseSnippetContent(fs.readFileSync(bracketPath, 'utf-8'));
        expect(content).toContain('function bracketStyle');
    });
});