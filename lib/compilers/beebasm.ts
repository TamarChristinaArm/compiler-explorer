// Copyright (c) 2021, Compiler Explorer Authors
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright notice,
//       this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.

import path from 'path';

import fs from 'fs-extra';

/// <reference types="../base-compiler" />
import {BaseCompiler} from '../base-compiler';
import {AsmParserBeebAsm} from '../parsers/asm-parser-beebasm';

export class BeebAsmCompiler extends BaseCompiler {
    static get key() {
        return 'beebasm';
    }

    constructor(compilerInfo, env) {
        super(compilerInfo, env);

        this.asm = new AsmParserBeebAsm(this.compilerProps);
    }

    override optionsForFilter() {
        return ['-v', '-do', 'disk.ssd'];
    }

    override getSharedLibraryPathsAsArguments() {
        return [];
    }

    override async runCompiler(compiler, options, inputFilename, execOptions) {
        if (!execOptions) {
            execOptions = this.getDefaultExecOptions();
        }

        const dirPath = path.dirname(inputFilename);
        if (!execOptions.customCwd) {
            execOptions.customCwd = dirPath;
        }

        options.splice(-1, 0, '-i');

        const result = await this.exec(compiler, options, execOptions);
        result.inputFilename = inputFilename;
        const transformedInput = result.filenameTransform(inputFilename);

        if (result.code === 0 && options.includes('-v')) {
            const outputFilename = this.getOutputFilename(dirPath, this.outputFilebase);
            fs.writeFileSync(outputFilename, result.stdout);
            result.stdout = '';
        }

        this.parseCompilationOutput(result, transformedInput);

        result.forceBinaryView = true;

        const file_buffer = await fs.readFile(path.join(dirPath, 'disk.ssd'));
        const binary_base64 = file_buffer.toString('base64');
        result.bbcdiskimage = binary_base64;

        return result;
    }
}