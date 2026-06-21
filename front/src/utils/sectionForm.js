export function validateSectionContent(sectionContent) {
  if (!sectionContent?.trim()) {
    return '암송 본문을 입력해 주세요.';
  }

  return null;
}
