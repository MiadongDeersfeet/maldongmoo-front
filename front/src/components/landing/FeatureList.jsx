import FeatureCard from './FeatureCard.jsx';
import './FeatureList.css';

const FEATURES = [
  {
    id: 'recite',
    title: '함께 암송',
    description: '방장이 등록한 말씀을 함께 암송해요.',
  },
  {
    id: 'checkin',
    title: '매일 인증',
    description: '녹음 또는 계수기로 하루 암송을 인증해요.',
  },
  {
    id: 'amen',
    title: '아멘 격려',
    description: '서로의 인증 카드에 아멘으로 응원해요.',
  },
  {
    id: 'room',
    title: '우리 암송방',
    description: '초대코드로 소규모 모임에 함께 참여해요.',
  },
];

export default function FeatureList() {
  return (
    <section className="feature-list" aria-label="서비스 소개">
      <div className="feature-list__grid">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.id} {...feature} />
        ))}
      </div>
    </section>
  );
}
