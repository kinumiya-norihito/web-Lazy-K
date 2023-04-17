/*ラムダ式を計算したりする*/
const calc_lambda = (code, lambda_csv) => {
    //変数
    let p0, p1, p2, l0; //pn:ポジション変数, ln:レベル変数
    //定数
    const pare_tab = x => ({ "(": 1, ")": -1 })[x] || 0;
    let suc;
    let arg;
    const params = [];
    // symbolと対応する置換表

    const corresp_table = lambda_csv.split("\n").filter(x => x.indexOf(",") >= 0).map(x => x.split(",")).filter(x => x[0].match(/^(<\w+>|[A-Za-z])$/));

    let is_change = false;
    //不要文字の削除(確認待ち)(必須)
    code = code.replace(/[^\\.<>()\[\]\w]/g, "");
    // ()除去_単純(確認待ち)
    code = code.replace(/\((<\w+>|\[(0|[1-9]\d*)\]|[A-Za-z])\)/, (_, x) => (is_change = true) && x);
    if (is_change) return code;
    // ()除去_複雑
    p0 = code.indexOf("((");
    while (p0 >= 0) {
        l0 = 0;
        //対応する)を探す
        for (p1 = p0 + 1; 0 <= l0; p1++)
            l0 += pare_tab(code[p1]);
        //code.substring(p1 - 2).indexOf("((")が0の時、それは((と))が対応していると言える
        //対応していない場合、?)となるはず
        if (!code.substring(p1 - 2).indexOf("))")) {
            code = code.substring(0, p0) + code.substring(p0 + 1, p1 - 1) + code.substring(p1);
            return code;
        }
        //見つからなかった場合は
        p0 = code.indexOf("((", p0 + 1);
    }
    // [n]解消
    //\を見つける
    p0 = code.indexOf("(\\");
    while (0 <= p0) {
        l0 = 0;
        //ここで1することで最初の(を無視する(帳尻合わせ)
        //これは(\[n].(...))の方
        for (p1 = p0 + 1; 0 <= l0; p1++)
            l0 += pare_tab(code[p1]);
        //引数となる部分を特定(<\w+>|[(0|[1-9]\d*)]|[A-Za-z]|その他括弧)
        switch (code[p1]) {
            case ")":
                suc = "";
                break;
            case "<":
                suc = code.substring(p1).match(/<\w+>/)[0];
                break;
            case "[":
                suc = code.substring(p1).match(/\[(0|[1-9]\d*)\]/)[0];
                break;
            case "(":
                l0 = 0;
                for (p2 = p1 + 1; 0 <= l0; p2++)
                    l0 += pare_tab(code[p2]);
                suc = code.substring(p1, p2);
                //厄介な処理
                break;
            default:
                suc = code[p1] || "";
        }
        p2 = p1 + suc.length;
        if (suc) {
            //引数の除去
            code = code.substring(0, p0) + code.substring(p0, p1).replace(/\\(\[(0|[1-9]\d*)\])./, (_, x) => (arg = x) && ("")) + code.substring(p2);
            code = code.replace(new RegExp(arg.replace(/\[|\]/g, "\\$&"), "g"), suc);
            return code;
        }
        p0 = code.indexOf("(\\", p0 + 1);
    }
    // symbol展開(確認待ち)
    code = code.replace(new RegExp(corresp_table.map(x => x[0]).join("|")), x => {
        is_change = true;
        const lambda_expr = corresp_table[corresp_table.map(x => x[0]).indexOf(x)][1];

        //引数を適切な数値に書き換え
        const par_max = Math.max(...(lambda_expr.match(/\d+/g) || [-1]));
        for (let i = 0; params.length <= par_max; i++) {
            //もし[i]が存在しなければ、値を追加
            if (code.indexOf(`[${i}]`) < 0)
                params.push(i);
        }
        return lambda_expr.replace(/\[(\d+)\]/g, (_, s) => {
            return `[${params[+s]}]`;
        });
    });
    if (is_change) return code;

    code.replace(/\[(0|[1-9]\d*)\]/g, x => {
        if (params.indexOf(x) < 0) params.push(x);
    });

    for (p0 = 0; p0 < params.length; p0++) {
        if (params.indexOf(`[${p0}]`) < 0) {
            const b = params[p0];
            const a = `[${p0}]`;
            params[p0] = a;
            code = code.replace(new RegExp(b.replace(/\[|\]/g, "\\$&"), "g"), a);
        }
        else if (params[p0] != `[${p0}]`) {
            for (p1 = 0; params.indexOf(`[${p1}]`) >= 0; p1++);
            const b = `[${p0}]`;
            const a = `[${p1}]`;
            params[params.indexOf(b)] = a;
            code = code.replace(new RegExp(b.replace(/\[|\]/g, "\\$&"), "g"), a);
            p0--;
        }
    }
    return code;
};

window.onload = () => {
    const
        code_area_elem = document.getElementById("code_area"),
        lambda_elem = document.getElementById("lambda"),
        run_button_elem = document.getElementById("run_button"),
        step_button_elem = document.getElementById("step_button");

    run_button_elem.addEventListener("click", () => {
        for (let i = 0; i < 10000; i++) {
            calc_lambda();
        }
    });
    step_button_elem.addEventListener("click", () => {
        code_area_elem.value = calc_lambda(code_area_elem.value, lambda_elem.value);
    });
};