const commandColor = '#569CD6'
const addressColor = `#4EC9B0`
const valueColor = `#9CDCFE`
const noteColor = `#F7BE02`
const ifColor = `#C586C0`
const functionNameColor = `#D7BA7D`
const asmRegisterColor = `#D16969`
const numberColor = `#B5CEA8`

function getTab(spaces = 4) {
    return `&nbsp;`.repeat(spaces)
}

function span(value, color) {
    return `<span style="color:${color};">${value}</span>`
}

function replaceAddressValueNote(tmp) {
    tmp = tmp.replace(/\(ADDRESS\)|\(ADDRESS(\d)\)/g, function(match, digit) {
      return digit ? span(`(ADDRESS` + digit + `)`, addressColor) : span(`(ADDRESS)`, addressColor)
    })

    tmp = tmp.replace(/\(VALUE\)|\(VALUE(\d)\)/g, function(match, digit) {
        return digit ? span(`(VALUE` + digit + `)`, valueColor) : span(`(VALUE)`, valueColor)
    })

    tmp = tmp.replace(/NOTE:/g, span(`NOTE:`, noteColor))
    return tmp
}

module.exports = {
    ConsoleWriteCLPS2C: function(string) {
        console.log(`%c[CLPS2C]`, "color:green;", `${string}`)
    },
    
    ConsoleWriteErrorCLPS2C: function(string) {
        console.log(`%c[CLPS2C]` + ` %c${string}`, "color:green;", "color:#f8442d")
    },

    GetExampleCode: function() {
        let Tmp = '// Declaration of variables which will be used later\n'
        Tmp += `Set MapID 0x3E1110\n`
        Tmp += `Set JobID 0x67381C\n`
        Tmp += `Set Player 0x2E1E40\n`
        Tmp += `Set CharHP 3D4AB0\n`
        Tmp += `Set CharHPMax 40\n`
        Tmp += `Set CoinCount 3D4B00\n`
        Tmp += `Set MyStr "Parkour_Start\\0"\n`
        Tmp += `\n`
        Tmp += `// Function to teleport the player to a location\n`
        Tmp += `Function WriteXYZ(base, valueX, valueY, valueZ)\n`
        Tmp += `    WritePointerFloat base,58,30 valueX\n`
        Tmp += `    WritePointerFloat base,58,34 valueY\n`
        Tmp += `    WritePointerFloat base,58,38 valueZ\n`
        Tmp += `EndFunction\n`
        Tmp += `\n`
        Tmp += `// Main code\n`
        Tmp += `If MapID =: 3 // If in world 3\n`
        Tmp += `    Write32 FB1580 0x123\n`
        Tmp += `    If JobID !. 0xFF && CoinCount =: 0 // If not in a job and the player has 0 coins\n`
        Tmp += `        Call WriteXYZ(Player, 1500, 2000, 600) // Warp player on top of the house\n`
        Tmp += `    EndIf\n`
        Tmp += `    Write32 CharHP CharHPMax // Write 40 to the player's hp\n`
        Tmp += `    WriteString 0x87310 MyStr\n`
        Tmp += `EndIf`
        return Tmp
    },

    GetAsmExampleCode: function() {
        let Tmp = `// Write the active character's XYZ coordinates (accessed by a pointer)\n`
        Tmp += `// to a specific address (003D0E10/4/8)\n`
        Tmp += `// If the value at 003D0D00 is 1, then get the values from 003D0E10/4/8\n`
        Tmp += `// and write them to the active character's coordinates\n`
        Tmp += `// - 002DE2F0,0x58,0x30/4/8 active character's coords \n`
        Tmp += `// - 003D1000 address to store our assembly code (codecave)\n`
        Tmp += `// - 003D0E10/4/8 address to store a copy of the coords\n`
        Tmp += `// - 003D0D00 custom flag. If it's 1, get the values from 003D0E00/4/8 and write them to the active character's coords\n`
        Tmp += 'Set Cave 003D1000\n'
        Tmp += `ASM_START Cave\n`
        Tmp += `    // Go to the active character's transformation component\n`
        Tmp += `    lw $t1,0x2DE2F0 // read active character pointer\n`
        Tmp += `    addi $t2,$t1,0x58 // add transformation offset\n`
        Tmp += `    lw $t2,($t2) // read the transformation pointer\n`
        Tmp += `    // Our target address (where we want to store the coords) is at 003D0E10\n`
        Tmp += `    lui $at,0x3D // All of our custom addresses are at 003Dnnnn. Load 003D0000\n`
        Tmp += `    lw $t3,0x30($t2) // get x coord\n`
        Tmp += `    lw $t4,0x34($t2) // get y coord\n`
        Tmp += `    lw $t5,0x38($t2) // get z coord\n`
        Tmp += `    sw $t3,0xE10($at) // store x coord at custom address\n`
        Tmp += `    sw $t4,0xE14($at) // store y coord at custom address\n`
        Tmp += `    sw $t5,0xE18($at) // store z coord at custom address\n`
        Tmp += `    // Check flag\n`
        Tmp += `    lw $t0,0xD00($at)\n`
        Tmp += `    li $t1,0x1\n`
        Tmp += `    beq $t0,$t1,SetCustomCoords // if the value at 003D0D00 == 1, then branch to SetCustomCoords\n`
        Tmp += `    nop // delay slot. Before taking the branch, the cpu will execute this line. Let's place a nop so it doesn't do anything.\n`
        Tmp += `    b Exit // else, branch to Exit\n`
        Tmp += `    nop // delay slot\n`
        Tmp += `    SetCustomCoords: sw $zero,0xD00($at) // set flag to 0\n`
        Tmp += `        lw $t3,0xE00($at) // load custom x coord\n`
        Tmp += `        lw $t4,0xE04($at) // load custom y coord\n`
        Tmp += `        lw $t5,0xE08($at) // load custom z coord\n`
        Tmp += `        sw $t3,0x30($t2) // store x coord\n`
        Tmp += `        sw $t4,0x34($t2) // store y coord\n`
        Tmp += `        sw $t5,0x38($t2) // store z coord\n`
        Tmp += `    Exit: jr $ra // return\n`
        Tmp += `        nop // delay slot\n`
        Tmp += `ASM_END`
        return Tmp
    },

    GetAsmRegistersCode: function() {
        let Tmp = `/*\n`
        Tmp += `General-Purpose Registers (GPRs)\n`
        Tmp += `Number      Name        Description\n`
        Tmp += `$0          $zero       Always zero.\n`
        Tmp += `$1          $at         Reserved for assembler.\n`
        Tmp += `$2,$3       $v0,$v1     First and second return values by functions.\n`
        Tmp += `$4-$7       $a0-$a3     First four arguments to functions.\n`
        Tmp += `$8-$15      $t0-$t7     Temporary registers. $t0-$t3 may also be used as additional argument registers.\n`
        Tmp += `$16-$23     $s0-$s7     Saved registers. Functions must save and restore these before using them.\n`
        Tmp += `$24,$25     $t8,$t9     More temporary registers.\n`
        Tmp += `$26,$27     $k0,$k1     Reserved for kernel (operating system).\n`
        Tmp += `$28         $gp         Global pointer.\n`
        Tmp += `$29         $sp         Stack pointer.\n`
        Tmp += `$30         $fp,$s8     Frame pointer.\n`
        Tmp += `$31         $ra         Return address. Used by JAL and JALR to store the address to return to after a function.\n`
        Tmp += `-           $pc         Program Counter. Indicates the address of the currently-executing instruction.\n`
        Tmp += `-           $hi         High-order bits. Stores the remainder of a division and the first 32 bits of the result of a multiplication. Can be accessed with mfhi.\n`
        Tmp += `-           $lo         Low-order bits. Stores the quotient of a division and the second 32 bits of the result of a multiplication. Can be accessed with mflo.\n`
        Tmp += `Floating-point Registers (FPRs)\n`
        Tmp += `Number      Name        Description\n`
        Tmp += `-           $f0-$f3     Return values.\n`
        Tmp += `-           $f4-$f11    Temporary registers.\n`
        Tmp += `-           $f12-$f19   Argument registers.\n`
        Tmp += `-           $f20-$f31   Saved registers.\n`
        Tmp += `*/`
        return Tmp
    },

    GetAsmAritInstructionsCode: function() {
        let Tmp = `/*\n`
        Tmp += `add: Adds the contents of register $rs to the contents of register $rt and stores the result in register $rd.\n`
        Tmp += `    Syntax: add $rd, $rs, $rt\n`
        Tmp += `addi: Add immediate. Adds the contents of register $rs to the specified immediate value and stores the result in register $rd.\n`
        Tmp += `    Syntax: addi $rd, $rs, immediate\n`
        Tmp += `addu: Add unsigned. Adds the unsigned contents of register $rs to the unsigned contents of register $rt and stores the result in register $rd.\n`
        Tmp += `    Syntax: addu $rd, $rs, $rt\n`
        Tmp += `addiu: Add immediate unsigned. Adds the unsigned contents of register $rs to the specified unsigned immediate value and stores the result in register $rd.\n`
        Tmp += `    Syntax: addiu $rd, $rs, immediate\n`
        Tmp += `sub: Subtracts the contents of register $rt from register $rs and stores the result in register $rd.\n`
        Tmp += `    Syntax: sub $rd, $rs, $rt\n`
        Tmp += `subu: Subtract unsigned. Subtracts the unsigned contents of register $rt from the unsigned contents of register $rs and stores the result in register $rd.\n`
        Tmp += `    Syntax: subu $rd, $rs, $rt\n`
        Tmp += `mult: Multiplies the contents of register $rs with the contents of register $rt and stores the result in the registers $hi and $lo.\n`
        Tmp += `    Syntax: mult $rs, $rt\n`
        Tmp += `multu: Multiply unsigned. Multiplies the unsigned contents of register $rs with the unsigned contents of register $rt and stores the result in the registers $hi and $lo.\n`
        Tmp += `    Syntax: multu $rs, $rt\n`
        Tmp += `div: Divides the contents of register $rs by the contents of register $rt and stores the quotient in the $lo register and the remainder in the $hi register.\n`
        Tmp += `    Syntax: div $rs, $rt\n`
        Tmp += `divu: Divide unsigned. Divides the unsigned contents of register $rs by the unsigned contents of register $rt and stores the quotient in the $lo register and the remainder in the $hi register.\n`
        Tmp += `    Syntax: divu $rs, $rt\n`
        Tmp += `move: Copies the contents of register $rs to register $rd. This is a pseudo-instruction: usually converted to "or $rd, $rs, $zero", or "addu $rd, $rs, $zero"\n`
        Tmp += `    Syntax: move $rd, $rs\n`
        Tmp += `mfhi: Move from hi. Copies the contents of register $hi to register $rd.\n`
        Tmp += `    Syntax: mfhi $rd\n`
        Tmp += `mflo: Move from lo. Copies the contents of register $lo to register $rd.\n`
        Tmp += `    Syntax: mflo $rd\n`
        Tmp += `mthi: Move to hi. Copies the contents of register $rs to register $hi.\n`
        Tmp += `    Syntax: mthi $rs\n`
        Tmp += `mtlo: Move to lo. Copies the contents of register $rs to register $lo.\n`
        Tmp += `    Syntax: mtlo $rs\n`
        Tmp += `*/`
        return Tmp
    },

    GetAsmLogicalInstructionsCode: function() {
        let Tmp = `/*\n`
        Tmp += `and: Performs a bitwise AND operation between the contents of registers $rs and $rt and stores the result in register $rd.\n`
        Tmp += `    Syntax: and $rd, $rs, $rt\n`
        Tmp += `andi: And immediate. Performs a bitwise AND operation between the contents of register $rs and the immediate value, and stores the result in register $rd.\n`
        Tmp += `    Syntax: andi $rd, $rs, immediate\n`
        Tmp += `or: Performs a bitwise OR operation between the contents of registers $rs and $rt and stores the result in register $rd.\n`
        Tmp += `    Syntax: or $rd, $rs, $rt\n`
        Tmp += `ori: Or immediate. Performs a bitwise OR operation between the contents of register $rs and the immediate value, and stores the result in register $rd.\n`
        Tmp += `    Syntax: ori $rd, $rs, immediate\n`
        Tmp += `xor: Performs a bitwise XOR operation between the contents of registers $rs and $rt and stores the result in register $rd.\n`
        Tmp += `    Syntax: xor $rd, $rs, $rt\n`
        Tmp += `xori: Performs a bitwise XOR operation between the contents of register $rs and the immediate value, and stores the result in register $rd.\n`
        Tmp += `    Syntax: xori $rd, $rs, immediate\n`
        Tmp += `nor: Performs a bitwise NOR operation between the contents of registers $rs and $rt and stores the result in register $rd.\n`
        Tmp += `    Syntax: nor $rd, $rs, $rt\n`
        Tmp += `sll: Shift left logical. Performs a logical left shift operation on register $rt, with the number of bits to shift specified by the immediate value, and stores the result in register $rd.\n`
        Tmp += `    Syntax: sll $rd, $rt, immediate\n`
        Tmp += `srl: Shift right logical. Performs a logical right shift operation on register $rt, with the number of bits to shift specified by the immediate value, and stores the result in register $rd.\n`
        Tmp += `    Syntax: srl $rd, $rt, immediate\n`
        Tmp += `slt: Set less than. Compares the signed values in registers $rs and $rt. If the value in $rs is less than the value in $rt, the destination register $rd is set to 1. Otherwise, it is set to 0.\n`
        Tmp += `    Syntax: slt $rd, $rs, $rt\n`
        Tmp += `slti: Set less than immediate. Compares the signed values in register $rs and the immediate value. If the value in $rs is less than the immediate value, the destination register $rd is set to 1. Otherwise, it is set to 0.\n`
        Tmp += `    Syntax: slti $rd, $rs, immediate\n`
        Tmp += `sltu: Set less than unsigned. Compares the unsigned values in registers $rs and $rt. If the value in $rs is less than the value in $rt, the destination register $rd is set to 1. Otherwise, it is set to 0.\n`
        Tmp += `    Syntax: sltu $rd, $rs, $rt\n`
        Tmp += `sltiu: Set less than immediate unsigned. Compares the unsigned values in register $rs and the immediate value. If the value in $rs is less than the immediate value, the destination register $rd is set to 1. Otherwise, it is set to 0.\n`
        Tmp += `    Syntax: sltiu $rd, $rs, immediate\n`
        Tmp += `*/`
        return Tmp
    },

    GetAsmLoadStoreInstructionsCode: function() {
        let Tmp = `/*\n`
        Tmp += `lb: Load byte. Loads a signed byte from memory in the $rt register.\n`
        Tmp += `    Syntax: lb $rt, offset($rs)\n`
        Tmp += `lbu: Load byte unsigned. Loads an unsigned byte from memory in the $rt register.\n`
        Tmp += `    Syntax: lbu $rt, offset($rs)\n`
        Tmp += `lh: Load halfword. Loads a signed halfword from memory in the $rt register.\n`
        Tmp += `    Syntax: lh $rt, offset($rs)\n`
        Tmp += `lhu: Load halfword unsigned. Loads an unsigned halfword from memory in the $rt register.\n`
        Tmp += `    Syntax: lhu $rt, offset($rs)\n`
        Tmp += `lw: Load word. Loads a word from memory in the $rt register.\n`
        Tmp += `    Syntax: lw $rt, offset($rs)\n`
        Tmp += `lwu: Load word unsigned. Loads an unsigned word from memory in the $rt register.\n`
        Tmp += `    Syntax: lwu $rt, offset($rs)\n`
        Tmp += `ld: Load doubleword. Loads a doubleword from memory in the $rt register.\n`
        Tmp += `    Syntax: ld $rt, offset($rs)\n`
        Tmp += `lui: Load upper immediate. Loads the immediate value into the upper half of the $rt register.\n`
        Tmp += `    Syntax: lui $rt, immediate\n`
        Tmp += `sb: Store byte. Stores a byte from the $rt register into memory.\n`
        Tmp += `    Syntax: sb $rt, offset($rs)\n`
        Tmp += `sh: Store halfword. Stores a halfword from the $rt register into memory.\n`
        Tmp += `    Syntax: sh $rt, offset($rs)\n`
        Tmp += `sw: Store word. Stores a word from the $rt register into memory.\n`
        Tmp += `    Syntax: sw $rt, offset($rs)\n`
        Tmp += `sd: Store doubleword. Stores a doubleword from the $rt register into memory.\n`
        Tmp += `    Syntax: sd $rt, offset($rs)\n`
        Tmp += `*/`
        return Tmp
    },

    GetAsmBranchJumpInstructionsCode: function() {
        let Tmp = `/*\n`
        Tmp += `beq: Branches if two values are equal ($rs == $rt).\n`
        Tmp += `    Syntax: beq $rs, $rt, offset\n`
        Tmp += `bne: Branches if two values are not equal ($rs != $rt).\n`
        Tmp += `    Syntax: bne $rs, $rt, offset\n`
        Tmp += `bltz: Branches if a value is less than zero ($rs < 0).\n`
        Tmp += `    Syntax: bltz $rs, offset\n`
        Tmp += `bgtz: Branches if a value is greater than zero ($rs > 0).\n`
        Tmp += `    Syntax: bgtz $rs, offset\n`
        Tmp += `blez: Branches if a value is less than or equal to zero ($rs <= 0).\n`
        Tmp += `    Syntax: blez $rs, offset\n`
        Tmp += `bgez: Branches if a value is greater than or equal to zero ($rs >= 0).\n`
        Tmp += `    Syntax: bgez $rs, offset\n`
        Tmp += `j: Jumps to a target address.\n`
        Tmp += `    Syntax: j immediate\n`
        Tmp += `jal: Jump and link. Jumps to a target address and stores the return address in the register $ra.\n`
        Tmp += `    Syntax: jal immediate\n`
        Tmp += `jr: Jump register. Jumps to the address stored in the register $rs.\n`
        Tmp += `    Syntax: jr $rs\n`
        Tmp += `jalr: Jump and link register. Jumps to the address stored in register $rs and stores the return address in the register $ra.\n`
        Tmp += `    Syntax: jalr $rs\n`
        Tmp += `*/`
        return Tmp
    },

    GetAsmFloatingPointInstructionsCode: function() {
        let Tmp = `/*\n`
        Tmp += `lwc1: Loads a floating point value from memory in the $ft register.\n`
        Tmp += `    Syntax: lwc1 $ft, offset($rs)\n`
        Tmp += `swc1: Stores a floating point value from the $rt register into memory.\n`
        Tmp += `    Syntax: swc1 $ft, offset($rs)\n`
        Tmp += `add.s: Adds two floating point values.\n`
        Tmp += `    Syntax: add.s $fd, $fs, $ft\n`
        Tmp += `sub.s: Subtracts one floating point value from another.\n`
        Tmp += `    Syntax: sub.s $fd, $fs, $ft\n`
        Tmp += `mul.s: Multiplies two floating point values.\n`
        Tmp += `    Syntax: mul.s $fd, $fs, $ft\n`
        Tmp += `div.s: Divides one floating point value by another.\n`
        Tmp += `    Syntax: div.s $fd, $fs, $ft\n`
        Tmp += `mov.s: Copies the contents of register $fs to register $fd.\n`
        Tmp += `    Syntax: mov.s $fd, $fs\n`
        Tmp += `sqrt.s: Calculates the square root of a floating point value.\n`
        Tmp += `    Syntax: sqrt.s $fd, $fs\n`
        Tmp += `abs.s: Calculates the absolute value of a floating point value.\n`
        Tmp += `    Syntax: abs.s $fd, $fs\n`
        Tmp += `neg.s: Calculates the negation of a floating point value.\n`
        Tmp += `    Syntax: neg.s $fd, $fs\n`
        Tmp += `mtc1: Copies a word to a floating point register.\n`
        Tmp += `    Syntax: mtc1 $rs, $fd\n`
        Tmp += `mfc1: Copies a floating point value to a general purpose register.\n`
        Tmp += `    Syntax: mfc1 $rd, $fs\n`
        Tmp += `cvt.s.w: Converts a word to a floating point value.\n`
        Tmp += `    Syntax: cvt.s.w $fd, $fs\n`
        Tmp += `cvt.w.s: Converts a floating point value to a word\n`
        Tmp += `    Syntax: cvt.w.s $fd, $fs\n`
        Tmp += `c.eq.s: Compares two floating point values for equality ($fs == $ft).\n`
        Tmp += `    Syntax: c.eq.s $fs, $ft\n`
        Tmp += `c.lt.s: Compares two floating point values for less than ($fs < $ft).\n`
        Tmp += `    Syntax: c.lt.s $fs, $ft\n`
        Tmp += `c.le.s: Compares two floating point values for less than or equal ($fs <= $ft).\n`
        Tmp += `    Syntax: c.le.s $fs, $ft\n`
        Tmp += `bc1t: Branch on FP condition true. To be used after a floating point comparison.\n`
        Tmp += `    Syntax: bc1t offset\n`
        Tmp += `bc1f: Branch on FP condition false. To be used after a floating point comparison.\n`
        Tmp += `    Syntax: bc1f offset\n`
        Tmp += `*/`
        return Tmp
    },

    abbreviationMap: {
        SE: `SETENCODING`,
        SR: `SENDRAW`,
        SRW: `SENDRAWWEIGHT`,
        W8: `WRITE8`,
        W16: `WRITE16`,
        W32: `WRITE32`,
        WF: `WRITEFLOAT`,
        WS: `WRITESTRING`,
        WB: `WRITEBYTES`,
        WP8: `WRITEPOINTER8`,
        WP16: `WRITEPOINTER16`,
        WP32: `WRITEPOINTER32`,
        WPF: `WRITEPOINTERFLOAT`,
        CB: `COPYBYTES`,
        F8: `FILL8`,
        F16: `FILL16`,
        F32: `FILL32`,
        I8: `INCREMENT8`,
        I16: `INCREMENT16`,
        I32: `INCREMENT32`,
        D8: `DECREMENT8`,
        D16: `DECREMENT16`,
        D32: `DECREMENT32`,
        EI: `ENDIF`
    },

    syntaxMap: {
        SET: `${span("Set", commandColor)} ${span("(NAME)", addressColor)} ${span("(VALUE)", valueColor)}`,
        SETENCODING: `${span("SetEncoding|SE", commandColor)} ${span("(VALUE)", valueColor)}`,
        SENDRAW: `${span("SendRaw|SR", commandColor)} ${span("(VALUE)", valueColor)}`,
        SENDRAWWEIGHT: `${span("SendRawWeight|SRW", commandColor)} ${span("(VALUE)", valueColor)}`,
        ASM_START: `${span("ASM_START", commandColor)} ${span("(ADDRESS)", addressColor)}`,
        ASM_END: `${span("ASM_END", commandColor)}`,
        INCLUDE: `${span("Include", commandColor)} ${span("(VALUE)", valueColor)}`,
        FUNCTION: `${span("Function", commandColor)} ${span("(NAME)", functionNameColor)} ${span("([ARGUMENTS])", "0")}`,
        ENDFUNCTION: `${span("EndFunction", commandColor)}`,
        CALL: `${span("Call", commandColor)} ${span("(NAME)", functionNameColor)} ${span("([ARGUMENTS])", "0")}`,
        WRITE8: `${span("Write8|W8", commandColor)} ${span("(ADDRESS)", addressColor)} ${span("(VALUE)", valueColor)}`,
        WRITE16: `${span("Write16|W16", commandColor)} ${span("(ADDRESS)", addressColor)} ${span("(VALUE)", valueColor)}`,
        WRITE32: `${span("Write32|W32", commandColor)} ${span("(ADDRESS)", addressColor)} ${span("(VALUE)", valueColor)}`,
        WRITEFLOAT: `${span("WriteFloat|WF", commandColor)} ${span("(ADDRESS)", addressColor)} ${span("(VALUE)", valueColor)}`,
        WRITESTRING: `${span("WriteString|WS", commandColor)} ${span("(ADDRESS)", addressColor)} ${span("(VALUE)", valueColor)}`,
        WRITEBYTES: `${span("WriteBytes|WB", commandColor)} ${span("(ADDRESS)", addressColor)} ${span("(VALUE)", valueColor)}`,
        WRITEPOINTER8: `${span("WritePointer8|WP8", commandColor)} ${span("(ADDRESS1),(ADDRESS2)[,ADDRESSN]", addressColor)} ${span("(VALUE)", valueColor)}`,
        WRITEPOINTER16: `${span("WritePointer8|WP16", commandColor)} ${span("(ADDRESS1),(ADDRESS2)[,ADDRESSN]", addressColor)} ${span("(VALUE)", valueColor)}`,
        WRITEPOINTER32: `${span("WritePointer8|WP32", commandColor)} ${span("(ADDRESS1),(ADDRESS2)[,ADDRESSN]", addressColor)} ${span("(VALUE)", valueColor)}`,
        WRITEPOINTERFLOAT: `${span("WritePointerFloat|WPF", commandColor)} ${span("(ADDRESS1),(ADDRESS2)[,ADDRESSN]", addressColor)} ${span("(VALUE)", valueColor)}`,
        COPYBYTES: `${span("CopyBytes|CB", commandColor)} ${span("(ADDRESS1)", addressColor)} ${span("(ADDRESS2)", addressColor)} ${span("(VALUE)", valueColor)}`,
        FILL8: `${span("Fill8|F8", commandColor)} ${span("(ADDRESS)", addressColor)} ${span("(VALUE1)", valueColor)} ${span("(VALUE2)", valueColor)}`,
        FILL16: `${span("Fill16|F16", commandColor)} ${span("(ADDRESS)", addressColor)} ${span("(VALUE1)", valueColor)} ${span("(VALUE2)", valueColor)}`,
        FILL32: `${span("Fill32|F32", commandColor)} ${span("(ADDRESS)", addressColor)} ${span("(VALUE1)", valueColor)} ${span("(VALUE2)", valueColor)}`,
        INCREMENT8: `${span("Increment8|I8", commandColor)} ${span("(ADDRESS)", addressColor)} ${span("(VALUE)", valueColor)}`,
        INCREMENT16: `${span("Increment16|I16", commandColor)} ${span("(ADDRESS)", addressColor)} ${span("(VALUE)", valueColor)}`,
        INCREMENT32: `${span("Increment32|I32", commandColor)} ${span("(ADDRESS)", addressColor)} ${span("(VALUE)", valueColor)}`,
        DECREMENT8: `${span("Decrement8|D8", commandColor)} ${span("(ADDRESS)", addressColor)} ${span("(VALUE)", valueColor)}`,
        DECREMENT16: `${span("Decrement16|D16", commandColor)} ${span("(ADDRESS)", addressColor)} ${span("(VALUE)", valueColor)}`,
        DECREMENT32: `${span("Decrement32|D32", commandColor)} ${span("(ADDRESS)", addressColor)} ${span("(VALUE)", valueColor)}`,
        OR8: `${span("OR8", commandColor)} ${span("(ADDRESS)", addressColor)} ${span("(VALUE)", valueColor)}`,
        OR16: `${span("OR16", commandColor)} ${span("(ADDRESS)", addressColor)} ${span("(VALUE)", valueColor)}`,
        AND8: `${span("AND8", commandColor)} ${span("(ADDRESS)", addressColor)} ${span("(VALUE)", valueColor)}`,
        AND16: `${span("AND16", commandColor)} ${span("(ADDRESS)", addressColor)} ${span("(VALUE)", valueColor)}`,
        XOR8: `${span("XOR8", commandColor)} ${span("(ADDRESS)", addressColor)} ${span("(VALUE)", valueColor)}`,
        XOR16: `${span("XOR16", commandColor)} ${span("(ADDRESS)", addressColor)} ${span("(VALUE)", valueColor)}`,
        IF: `${span("If", "#C586C0")} ${span("(ADDRESS)", addressColor)} ${span("(CONDITION)", "#C586C0")}${span("(DATATYPE)", "#C586C0")} ${span("(VALUE)", valueColor)} [${span("&& ", "#C586C0")} ${span("(ADDRESS)", addressColor)} ${span("(CONDITION)", "#C586C0")}${span("(DATATYPE)", "#C586C0")} ${span("(VALUE)", valueColor)}]`,
        ENDIF: `${span("EndIf|EI", "#C586C0")}`,
    },

    getDescriptionFromCommandName: function (name) {
        let Output = ""
        switch (name) {
            case "SET":
                Output = `Declares a variable with the name ${span(`(NAME)`, addressColor)} and assigns the value (VALUE) to it.<br>`
                Output += `Once a variable is declared, declaring it once again will replace its value.<br>`
                Output += `A variable can assume the value of an already declared variable.<br>`
                Output += `NOTE: This instruction does not get translated to a cheat code.<br><br>`
                Output += `**Arguments:**<br>${getTab()}${span(`(NAME)`, addressColor)} Name of the variable<br>${getTab()}(VALUE) Value to assign to the variable`
                break
            case "SETENCODING":
                Output = `Sets the current encoding (VALUE) to be used for the ${span(`WriteString`, commandColor)} command.<br>`
                Output += `The encoding chosen will be used until another ${span(`SetEncoding`, commandColor)} command is encountered.<br>`
                Output += `NOTE: This instruction does not get translated to a cheat code.<br><br>`
                Output += `**Arguments:**<br>${getTab()}(VALUE)<br>${getTab()}${getTab()}UTF-8 (default)<br>${getTab()}${getTab()}UTF-16`
                break
            case "SENDRAW":
                Output = `Writes a raw string (VALUE) to the output.<br>`
                Output += `Condition for (VALUE): Always use the double quotes symbol (") as the prefix and suffix when not using a declared variable.<br>`
                Output += `NOTE: This instruction does not get translated to a cheat code.<br><br>`
                Output += `**Arguments:**<br>${getTab()}(VALUE) Value to write`
                break
            case "SENDRAWWEIGHT":
                Output = `Writes a raw string (VALUE) to the output.<br>`
                Output += `Same as "${span(`SendRaw`, commandColor)}" but carries a "weight" value:<br>`
                Output += `${getTab()}"${span(`If`, ifColor)}" commands will consider this a "valid" cheat line and will take it into account when calculating how many lines to execute.<br>`
                Output += `By default, the command has a weight value of 1. For each '\\n' character in (VALUE) the weight value gets incremented by 1.<br>`
                Output += `Condition for (VALUE): Always use the double quotes symbol (") as the prefix and suffix when not using a declared variable.<br><br>`
                Output += `**Arguments:**<br>${getTab()}(VALUE) Value to write`
                break
            case "ASM_START":
                Output = `Defines the beginning of an assembly scope.<br>`
                Output += `While in this scope, all the other CLPS2C commands can't be executed (with the exception of the ${span(`ASM_END`, commandColor)} command).<br>`
                Output += `While in this scope, values set with the ${span(`Set`, commandColor)} command will not be applied.<br>`
                Output += `Every register must be prefixed with the dollar sign ($).<br>`
                Output += `Labels can be used, but the first instruction must be on the same line as the label ("myLabel: ${span(`li`, commandColor)} ${span(`$t0`, asmRegisterColor)},${span(`1`, numberColor)}").<br>`
                Output += `Always have an ${span(`ASM_END`, commandColor)} to indicate the termination of the assembly scope.<br>`
                Output += `Check out the "CLPS2C: Assembly - Paste example code" command from the command palette to see an example usage.<br>`
                Output += `NOTE: You must manually add the branch delay slot after any branch instruction.<br><br>`
                Output += `**Arguments:**<br>${getTab()}(ADDRESS) Starting address`
                break
            case "ASM_END":
                Output = `Defines the ending of an assembly scope. See the ${span(`ASM_START`, commandColor)} command for more details.<br>`
                break
            case "INCLUDE":
                Output = `Parses a specific file.<br>`
                Output += `Condition for (VALUE): Always use the double quotes symbol (") as the prefix and suffix when not using a declared variable.<br>`
                Output += `It's possible that an Include command is present in an included file:<br>`
                Output += `${getTab()}For example, let the file "Engine.txt" have this line of code: Include "Player.txt"<br>`
                Output += `${getTab()}By including the "Engine.txt" file, it will also parse the line above, and so, also include the "Player.txt" file.<br>`
                Output += `NOTE: A file must not include itself, or include another file which includes one of the previous files.<br>`
                Output += `${getTab()}For example, let the file "Engine.txt" have this line of code: Include "Engine.txt"<br>`
                Output += `${getTab()}This will create infinite recursion, running that same Include command until a StackOverflowException happens.<br>`
                Output += `${getTab()}The app will detect this happening and will stop executing, displaying a INCLUDE_STACK_OVERFLOW error.<br>`
                Output += `NOTE: The addition operator is not supported for this command.<br>`
                Output += `NOTE: The (VALUE) argument can't be replaced with a variable.<br><br>`
                Output += `**Arguments:**<br>${getTab()}(VALUE)<br>`
                Output += `${getTab()}${getTab()}1) Absolute path: "C:\\Users\\admin\\Desktop\\CLPS2C\\IncludeExample\\Sly2\\NTSC\\Engine.txt"<br>`
                Output += `${getTab()}${getTab()}2) Relative path to the input file path (same folder as the input file): "Engine.txt"<br>`
                Output += `${getTab()}${getTab()}3) Relative path to the input file path (sub-folder(s) from the input file): "IncludeExample\\Sly2\\NTSC\\Engine.txt"<br>`
                Output += `${getTab()}${getTab()}4) Relative path to the most recent included file path: "C:\\Users\\admin\\Desktop\\CLPS2C\\IncludeExample\\Sly2\\NTSC\\Engine.txt"<br>`
                Output += `${getTab()}${getTab()}${getTab()}includes "Gui.txt" (in the folder C:\\Users\\admin\\Desktop\\CLPS2C\\IncludeExample\\Sly2\\NTSC)<br>`
                break
            case "FUNCTION":
                Output = `Defines a function (a collection of commands) which can be executed by the "${span(`Call`, commandColor)}" command.<br>`
                Output += `It is possible to pass arguments, separated by a comma (","), to the function.<br>`
                Output += `Always have an "${span(`EndFunction`, commandColor)}" command to indicate the termination of the function scope.<br>`
                Output += `NOTE: A "${span(`Function`, commandColor)}" scope must not have a "${span(`Function`, commandColor)}" command inside.<br>`
                Output += `NOTE: A "${span(`Function`, commandColor)}" scope must not have an "${span(`Include`, commandColor)}" command inside.<br>`
                Output += `NOTE: Recursive functions are not allowed. A "${span(`Call`, commandColor)}" command must not invoke the function they are a part of.<br>`
                Output += `NOTE: A function must not be defined more than once.<br>`
                Output += `NOTE: The addition operator is not supported for the "${span(`Function`, commandColor)}" command, but it is for the commands inside the function and the "${span(`Call`, commandColor)}" command.<br><br>`
                Output += `**Arguments:**<br>${getTab()}${span(`(NAME)`, functionNameColor)} The name of the function<br>`
                Output += `${getTab()}([ARGUMENTS]) List of arguments separated by a comma`
                break
            case "ENDFUNCTION":
                Output = `Defines the ending of a function scope.<br>`
                break
            case "CALL":
                Output = `Calls a defined function. See the ${span(`Function`, commandColor)} command for more details.<br><br>`
                Output += `**Arguments:**<br>${getTab()}${span(`(NAME)`, functionNameColor)} The name of the function<br>`
                Output += `${getTab()}([ARGUMENTS]) List of arguments separated by a comma`
                break
            case "WRITE8":
                Output = `Writes an 8-bit (1 byte) value (VALUE) to the address (ADDRESS).<br>`
                Output += `Condition for (VALUE): 0x00 <= (VALUE) <= 0xFF<br><br>`
                Output += `**Arguments:**<br>${getTab()}(ADDRESS) The address to which the value will be written to<br>${getTab()}(VALUE) The value to write`
                break
            case "WRITE16":
                Output = `Writes a 16-bit (2 bytes) value (VALUE) to the address (ADDRESS).<br>`
                Output += `Condition for (VALUE): 0x0000 <= (VALUE) <= 0xFFFF<br><br>`
                Output += `**Arguments:**<br>${getTab()}(ADDRESS) The address to which the value will be written to<br>${getTab()}(VALUE) The value to write`
                break
            case "WRITE32":
                Output = `Writes a 32-bit (4 bytes) value (VALUE) to the address (ADDRESS).<br>`
                Output += `Condition for (VALUE): 0x00000000 <= (VALUE) <= 0xFFFFFFFF<br><br>`
                Output += `**Arguments:**<br>${getTab()}(ADDRESS) The address to which the value will be written to<br>${getTab()}(VALUE) The value to write`
                break
            case "WRITEFLOAT":
                Output = `Writes a 32-bit floating-point value (VALUE) to the address (ADDRESS).<br>`
                Output += `If (VALUE) is an hexadecimal number, it will be parsed as one.<br><br>`
                Output += `**Arguments:**<br>${getTab()}(ADDRESS) The address to which the value will be written to<br>${getTab()}(VALUE) The value to write`
                break
            case "WRITESTRING":
                Output = `Writes a string (VALUE) to the address (ADDRESS) with the current encoding (can be changed with the ${span(`SetEncoding`, commandColor)} command).<br>`
                Output += `Condition for (VALUE): Always use the double quotes symbol (") as the prefix and suffix when not using a declared variable.<br>`
                Output += `NOTE: Append "\\0" at the end of the string to add a null terminator character.<br>`
                Output += `NOTE: When ((VALUE).Length % 4 != 0), more writes of different data types are needed:<br>`
                Output += `${getTab()}"park"${getTab(6)}-> Write32.<br>`
                Output += `${getTab()}"parko"${getTab()}-> Write32+Write8.<br>`
                Output += `${getTab()}"parkou"${getTab(2)}-> Write32+Write16.<br>`
                Output += `${getTab()}"parkour"${getTab(1)}-> Write32+Write16+Write8.<br><br>`
                Output += `**Arguments:**<br>${getTab()}(ADDRESS) The address to which the value will be written to<br>${getTab()}(VALUE) The value to write`
                break
            case "WRITEBYTES":
                Output = `Writes a byte array (VALUE) to the address (ADDRESS).<br>`
                Output += `Condition for (VALUE): Always use the double quotes symbol (") as the prefix and suffix when not using a declared variable.<br>`
                Output += `NOTE: When ((VALUE).Length % 4 != 0), more writes of different data types are needed:<br>`
                Output += `${getTab()}"00 11 22 33"${getTab(16)}-> Write32.<br>`
                Output += `${getTab()}"00 11 22 33 44"${getTab(11)}-> Write32+Write8.<br>`
                Output += `${getTab()}"00 11 22 33 44 55"${getTab(6)}-> Write32+Write16.<br>`
                Output += `${getTab()}"00 11 22 33 44 55 66"${getTab(1)}-> Write32+Write16+Write8.<br><br>`
                Output += `**Arguments:**<br>${getTab()}(ADDRESS) The address to which the value will be written to<br>${getTab()}(VALUE) The value to write`
                break
            case "WRITEPOINTER8":
                Output = `Writes an 8-bit (1 byte) value (VALUE) to the address calculated by<br>`
                Output += `loading the base (ADDRESS1) and adding (ADDRESS2) and ${span(`[,ADDRESSN]`, addressColor)}.<br>`
                Output += `Each (ADDRESS) must be separated by a comma (,).<br>`
                Output += `Condition for (VALUE): 0x00 <= (VALUE) <= 0xFF<br><br>`
                Output += `**Arguments:**<br>${getTab()}(ADDRESS1),(ADDRESS2)${span(`[,ADDRESSN]`, addressColor)} The pointer chain to which the value will be written to<br>${getTab()}(VALUE) The value to write`
                break
            case "WRITEPOINTER16":
                Output = `Writes a 16-bit (2 bytes) value (VALUE) to the address calculated by<br>`
                Output += `loading the base (ADDRESS1) and adding (ADDRESS2) and ${span(`[,ADDRESSN]`, addressColor)}.<br>`
                Output += `Each (ADDRESS) must be separated by a comma (,).<br>`
                Output += `Condition for (VALUE): 0x0000 <= (VALUE) <= 0xFFFF<br><br>`
                Output += `**Arguments:**<br>${getTab()}(ADDRESS1),(ADDRESS2)${span(`[,ADDRESSN]`, addressColor)} The pointer chain to which the value will be written to<br>${getTab()}(VALUE) The value to write`
                break
            case "WRITEPOINTER32":
                Output = `Writes a 32-bit (4 bytes) value (VALUE) to the address calculated by<br>`
                Output += `loading the base (ADDRESS1) and adding (ADDRESS2) and ${span(`[,ADDRESSN]`, addressColor)}.<br>`
                Output += `Each (ADDRESS) must be separated by a comma (,).<br>`
                Output += `Condition for (VALUE): 0x00000000 <= (VALUE) <= 0xFFFFFFFF<br><br>`
                Output += `**Arguments:**<br>${getTab()}(ADDRESS1),(ADDRESS2)${span(`[,ADDRESSN]`, addressColor)} The pointer chain to which the value will be written to<br>${getTab()}(VALUE) The value to write`
                break
            case "WRITEPOINTERFLOAT":
                Output = `Writes a 32-bit floating-point value (VALUE) to the address calculated by<br>`
                Output += `loading the base (ADDRESS1) and adding (ADDRESS2) and ${span(`[,ADDRESSN]`, addressColor)}.<br>`
                Output += `Each (ADDRESS) must be separated by a comma (,).<br>`
                Output += `If (VALUE) is an hexadecimal number, it will be parsed as one.<br><br>`
                Output += `**Arguments:**<br>${getTab()}(ADDRESS1),(ADDRESS2)${span(`[,ADDRESSN]`, addressColor)} The pointer chain to which the value will be written to<br>${getTab()}(VALUE) The value to write`
                break
            case "COPYBYTES":
                Output = `Copies a block of (VALUE) bytes from source address (ADDRESS1) to destination address (ADDRESS2).<br><br>`
                Output += `**Arguments:**<br>${getTab()}(ADDRESS1) Source address<br>${getTab()}(ADDRESS2) Destination address<br>${getTab()}(VALUE) Length in bytes`
                break
            case "FILL8":
                Output = `Writes an 8-bit (1 byte) value (VALUE1) for (VALUE2) bytes starting from the address (ADDRESS).<br>`
                Output += `Condition for (VALUE1): 0x00 <= (VALUE1) <= 0xFF<br>`
                Output += `Condition for (VALUE2): 0x00 <= (VALUE2) <= 0xFFFF<br>`
                Output += `NOTE: This command outputs a 8-type code ("8-bit constant serial write").<br>`
                Output += `${getTab()}Latest PCSX2 (v1.7.X) does not support 8-type codes.<br><br>`
                Output += `**Arguments:**<br>${getTab()}(ADDRESS) Starting address<br>${getTab()}(VALUE1) Value to write<br>${getTab()}(VALUE2) Length in bytes`
                break
            case "FILL16":
                Output = `Writes a 16-bit (2 bytes) value (VALUE1) for (VALUE2) bytes starting from the address (ADDRESS).<br>`
                Output += `Condition for (VALUE1): 0x00 <= (VALUE1) <= 0xFFFF<br>`
                Output += `Condition for (VALUE2): 0x00 <= (VALUE2) <= 0x1FFFE<br>`
                Output += `NOTE: (VALUE2) must be divisible by 2.<br>`
                Output += `NOTE: This command outputs a 8-type code ("16-bit constant serial write").<br>`
                Output += `${getTab()}Latest PCSX2 (v1.7.X) does not support 8-type codes.<br><br>`
                Output += `**Arguments:**<br>${getTab()}(ADDRESS) Starting address<br>${getTab()}(VALUE1) Value to write<br>${getTab()}(VALUE2) Length in bytes`
                break
            case "FILL32":
                Output = `Writes a 32-bit (4 bytes) value (VALUE1) for (VALUE2) bytes starting from the address (ADDRESS).<br>`
                Output += `Condition for (VALUE1): 0x00 <= (VALUE1) <= 0xFFFFFFFF<br>`
                Output += `Condition for (VALUE2): 0x00 <= (VALUE2) <= 0x3FFFC<br>`
                Output += `NOTE: (VALUE2) must be divisible by 4.<br>`
                Output += `NOTE: This command outputs a 4-type code ("32-bit constant serial write").<br><br>`
                Output += `**Arguments:**<br>${getTab()}(ADDRESS) Starting address<br>${getTab()}(VALUE1) Value to write<br>${getTab()}(VALUE2) Length in bytes`
                break
            case "INCREMENT8":
                Output = `Increments the 8-bit (1 byte) value at address (ADDRESS) by the 8-bit (1 byte) value (VALUE).<br><br>`
                Output += `**Arguments:**<br>${getTab()}(ADDRESS) The address to which the value will be read from and written to<br>${getTab()}(VALUE) The value that will be added to the existing value at the specified address<br>`
                break
            case "INCREMENT16":
                Output = `Increments the 16-bit (2 bytes) value at address (ADDRESS) by the 16-bit (2 bytes) value (VALUE).<br><br>`
                Output += `**Arguments:**<br>${getTab()}(ADDRESS) The address to which the value will be read from and written to<br>${getTab()}(VALUE) The value that will be added to the existing value at the specified address<br>`
                break
            case "INCREMENT32":
                Output = `Increments the 32-bit (4 bytes) value at address (ADDRESS) by the 32-bit (4 bytes) value (VALUE).<br><br>`
                Output += `**Arguments:**<br>${getTab()}(ADDRESS) The address to which the value will be read from and written to<br>${getTab()}(VALUE) The value that will be added to the existing value at the specified address<br>`
                break
            case "DECREMENT8":
                Output = `Decrements the 8-bit (1 byte) value at address (ADDRESS) by the 8-bit (1 byte) value (VALUE).<br><br>`
                Output += `**Arguments:**<br>${getTab()}(ADDRESS) The address to which the value will be read from and written to<br>${getTab()}(VALUE) The value that will be subtracted to the existing value at the specified address<br>`
                break
            case "DECREMENT16":
                Output = `Decrements the 16-bit (2 bytes) value at address (ADDRESS) by the 16-bit (2 bytes) value (VALUE).<br><br>`
                Output += `**Arguments:**<br>${getTab()}(ADDRESS) The address to which the value will be read from and written to<br>${getTab()}(VALUE) The value that will be subtracted to the existing value at the specified address<br>`
                break
            case "DECREMENT32":
                Output = `Decrements the 32-bit (4 bytes) value at address (ADDRESS) by the 32-bit (4 bytes) value (VALUE).<br><br>`
                Output += `**Arguments:**<br>${getTab()}(ADDRESS) The address to which the value will be read from and written to<br>${getTab()}(VALUE) The value that will be subtracted to the existing value at the specified address<br>`
                break
            case "OR8":
                Output = `Bitwise 8-bit (1 byte) OR operation between the value stored at address (ADDRESS) and (VALUE). Store the result at the address (ADDRESS).<br><br>`
                Output += `**Arguments:**<br>${getTab()}(ADDRESS) The address to which the value will be read from and written to<br>${getTab()}(VALUE) The value that will be OR'ed to the existing value at the specified address<br>`
                break
            case "OR16":
                Output = `Bitwise 16-bit (2 bytes) OR operation between the value stored at address (ADDRESS) and (VALUE). Store the result at the address (ADDRESS).<br><br>`
                Output += `**Arguments:**<br>${getTab()}(ADDRESS) The address to which the value will be read from and written to<br>${getTab()}(VALUE) The value that will be OR'ed to the existing value at the specified address<br>`
                break
            case "AND8":
                Output = `Bitwise 8-bit (1 byte) AND operation between the value stored at address (ADDRESS) and (VALUE). Store the result at the address (ADDRESS).<br><br>`
                Output += `**Arguments:**<br>${getTab()}(ADDRESS) The address to which the value will be read from and written to<br>${getTab()}(VALUE) The value that will be AND'ed to the existing value at the specified address<br>`
                break
            case "AND16":
                Output = `Bitwise 16-bit (2 bytes) AND operation between the value stored at address (ADDRESS) and (VALUE). Store the result at the address (ADDRESS).<br><br>`
                Output += `**Arguments:**<br>${getTab()}(ADDRESS) The address to which the value will be read from and written to<br>${getTab()}(VALUE) The value that will be AND'ed to the existing value at the specified address<br>`
                break
            case "XOR8":
                Output = `Bitwise 8-bit (1 byte) XOR operation between the value stored at address (ADDRESS) and (VALUE). Store the result at the address (ADDRESS).<br><br>`
                Output += `**Arguments:**<br>${getTab()}(ADDRESS) The address to which the value will be read from and written to<br>${getTab()}(VALUE) The value that will be XOR'ed to the existing value at the specified address<br>`
                break
            case "XOR16":
                Output = `Bitwise 16-bit (2 bytes) XOR operation between the value stored at address (ADDRESS) and (VALUE). Store the result at the address (ADDRESS).<br><br>`
                Output += `**Arguments:**<br>${getTab()}(ADDRESS) The address to which the value will be read from and written to<br>${getTab()}(VALUE) The value that will be XOR'ed to the existing value at the specified address<br>`
                break
            case "IF":
                Output = `Compares the value at address (ADDRESS) with (VALUE), by using the condition ${span(`(CONDITION)`, ifColor)}.<br>`
                Output += `Always specify whether to check for 1 byte or 2 bytes with ${span(`(DATATYPE)`, ifColor)}.<br>`
                Output += `Always have an ${span(`EndIf`, ifColor)} command to indicate the termination of the ${span(`If`, ifColor)} scope.<br>`
                Output += `It is possible to have multiple conditions in a single ${span(`If`, ifColor)} command through the use of the logical AND operator ("${span(`&&`, ifColor)}").<br>`
                Output += `NOTE: One E-type code (or D-type code) has a maximum of 0xFF lines that they can execute. If more than 0xFF produced lines are present in an ${span(`If`, ifColor)} scope, the ${span(`If`, ifColor)} command(s) will be repeated as many times as needed.<br><br>`
                Output += `**Arguments:**<br>`
                Output += `${getTab()}(ADDRESS) The address which contains the first operand<br>`
                Output += `${getTab()}${span(`(CONDITION)`, ifColor)} The comparison condition<br>`
                Output += `${getTab()}${getTab()}${span(`=`, ifColor)} equality<br>`
                Output += `${getTab()}${getTab()}${span(`!`, ifColor)} inequality<br>`
                Output += `${getTab()}${getTab()}${span(`<`, ifColor)} less than<br>`
                Output += `${getTab()}${getTab()}${span(`>`, ifColor)} greater than<br>`
                Output += `${getTab()}${getTab()}${span(`&#126;&`, ifColor)} NAND<br>`
                Output += `${getTab()}${getTab()}${span(`&`, ifColor)} AND<br>`
                Output += `${getTab()}${getTab()}${span(`&#126;|`, ifColor)} NOR<br>`
                Output += `${getTab()}${getTab()}${span(`|`, ifColor)} OR<br>`
                Output += `${getTab()}${span(`(DATATYPE)`, ifColor)} The datatype to be used for the comparison<br>`
                Output += `${getTab()}${getTab()}${span(`.`, ifColor)} 8-bit (1 byte)<br>`
                Output += `${getTab()}${getTab()}${span(`:`, ifColor)} 16-bit (2 bytes)<br>`
                Output += `${getTab()}(VALUE) The value to be compared against (second operand)<br>`
                Output += `${getTab()}${span(`[&&]`, ifColor)} Logical AND<br>`
                break
            case "ENDIF":
                Output = `Defines the ending of an ${span(`If`, ifColor)} scope. See the ${span(`If`, ifColor)} command for more details.<br>`
                break
            default:
                Output = `Something wrong happened when trying to get the command's description. This should never happen.`
                break
        }
        Output = replaceAddressValueNote(Output)
        return Output
    }
}