function grade_point(score) {
    if (score >= 60)
        return (4 - 3 * Math.pow(100 - score , 2) / 1600);
    return 0;
}

function round(x, n) { return parseFloat(x.toFixed(n)); }

function analyze(text) {
    var courses = {
        "公共基础课程": 60,
        "大类基础课程": 26,
        "专业必修课程": 38,
        "专业选修课程": 24,
        "通识选修课程": 10,
        "新生研讨课程":  0,
        "公共选修课程":  2,
        "通识教育课程":  0
    }
    for (var course in courses) {
        total_need = courses[course];
        courses[course] = {
            "需要学分": total_need,
            "已修学分": 0,
            "及格学分": 0,
            "还欠学分": 0,
            "已修课程": []
        }
    }

    var degree_courses = new Set([
        "力学",
        "热学",
        "电磁学",
        "光学",
        "原子物理学",
        "热力学与统计物理",
        "电动力学",
        "量子力学",
        "固体物理（一）",
        "半导体物理与器件"
    ])

    var total_gp = gpa_credit = 0;
    var degree_gp = degree_gpa_credit = 0;

    var i, course, credit, type, score;
    var gp, gpoint, credit_passed;
    var lines = text.split(/\n/);
    for (i = 0; i < lines.length; ++i) {
        array = lines[i].split(/\s+/);
        if (array.length < 7) {
            continue;
        }
        course = array[3];
        credit = parseFloat(array[4]);
        credit_passed = credit;
        type = array[5];
        score = array[6];
        gpoint = null;

        if (/[A-F]/.test(score)) {
            if (score == 'F') {
                credit_passed = 0;
            }
        } else {
            score = parseInt(score);
            gpoint = grade_point(score);
            gp = credit * gpoint;

            total_gp += gp
            gpa_credit += credit
            if (degree_courses.has(course)) {
                degree_gp += gp;
                degree_gpa_credit += credit;
            }

            if (score < 60) {
                credit_passed = 0;
            }
        }

        var items = [course, round(credit, 1), score];
        if (gpoint != null) {
            items.push(round(gpoint, 1));
        }

        courses[type]["已修学分"] += credit;
        courses[type]["及格学分"] += credit_passed;
        courses[type]["已修课程"].push(items);
    }

    var credits = {
        "GPA":  round(total_gp / gpa_credit, 1),
        "学位课程 GPA": round(degree_gp / degree_gpa_credit, 1),
        "合计": {
            "需要学分": 0,
            "已修学分": 0,
            "及格学分": 0,
            "还欠学分": 0
        }
    }

    var total = credits["合计"];
    for (var key in courses) {
        value = courses[key];
        if (value["已修课程"].length == 0){
            delete courses[key];
        }
        else {
            need = value["需要学分"];
            your = value["及格学分"];
            lack = Math.max(need - your, 0);

            value["还欠学分"] = lack;
            value["已修课程"].sort(function(a, b) {
                if (a[0] < b[0]) return -1;
                if (a[0] > b[0]) return 1;
                return 0;
            });
            value["已修课程"].splice(0, 0, ["课程", "学分", "成绩", "绩点"]);

            total["需要学分"] += need;
            total["已修学分"] += value["已修学分"];
            total["及格学分"] += your;
            total["还欠学分"] += lack;
        }
    }

    tsxx = courses["通识选修课程"];
    xsyt = courses["新生研讨课程"];
    tsxx_passed = tsxx["及格学分"];
    xsyt_passed = xsyt["及格学分"];
    if ((tsxx_passed + xsyt_passed) >= 10 && xsyt_passed <= 4) {
        total["还欠学分"] -= tsxx["还欠学分"];
        total["还欠学分"] -= xsyt["还欠学分"];
        tsxx["还欠学分"] = 0;
        xsyt["还欠学分"] = 0;
    }

    Object.assign(credits, courses);

    return credits;
}

function json_text(json) {
    var text = JSON.stringify(json, null, 4);
    matches = text.match(/(?<=\[)[^\[\]]+?(?=\])/gm);
    for (var i in matches) {
        m = matches[i];
        var items = m.split(/,\s*/);
        for (var j in items) {
            items[j] = items[j].trim();
        }
        text = text.replace(m, items.join(", "));
    }

    text = text.replace(/},/g, "},\n")

    return text;
}
