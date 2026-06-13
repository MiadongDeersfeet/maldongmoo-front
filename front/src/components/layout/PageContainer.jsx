import './PageContainer.css';

export default function PageContainer({ children, className = '' }) {
  const classes = ['page-container', className].filter(Boolean).join(' ');
  return <div className={classes}>{children}</div>;
}
