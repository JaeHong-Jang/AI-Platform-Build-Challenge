// '포함'을 조건 없이 밝힌 문장인지 가린다. 견적서 품목 문구(rules.ts)와 업체 답변(agent.ts)이 같은 기준을 쓴다. (LLM 없음)
// 제외·조건부·보류·금액·부담·거절·고객 몫 표현이 있으면 명시로 보지 않는다.
// 예외 두 가지만 먼저 지운다: "추가 비용(은) 없습니다" 같은 '추가 없음', 그리고 견적 총액 그 자체의 언급.
const PLAIN_NONE = /(추가|별도)\s*(비용|요금|금액|돈)?\s*(은|는|이|가)?\s*(없|안\s*받|받지\s*않)/g;
const NOT_PLAIN_YES = /제외|불가|안\s*됩|안\s*돼|안\s*해|못\s*해|어렵|당일|보고|봐야|협의|결정|미정|확인\s*후|문의|상황|따라|모르|글쎄|아마|부담|직접|본인|고객\s*님?\s*(이|께서|이\s*직접)|비포함|빠집|빠져|까지만|추가|별도|더\s*(붙|나|받)|\d+\s*만|\d[\d,]*\s*원/;

export function amountForms(n: number): string[] {
  const forms = [String(n), n.toLocaleString("ko-KR")];
  if (n % 10000 === 0) forms.push(`${n / 10000}만`);
  return forms;
}

/** 명시로 볼 수 없는 표현을 찾는다. 없으면 null */
export function notPlain(quote: string, total: number | null): string | null {
  let q = quote.replace(PLAIN_NONE, "");
  if (total !== null) for (const f of amountForms(total)) q = q.split(f).join(" "); // "35만원에 포함" = 견적 총액에 포함
  const m = q.match(NOT_PLAIN_YES);
  return m ? m[0] : null;
}
