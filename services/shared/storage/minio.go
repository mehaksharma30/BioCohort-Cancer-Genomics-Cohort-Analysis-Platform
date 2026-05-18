package storage

import (
	"bytes"
	"context"
	"fmt"

	"biocohort/shared/config"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type Client struct {
	bucket string
	minio  *minio.Client
}

func New(cfg config.Config) (*Client, error) {
	client, err := minio.New(cfg.MinIOEndpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.MinIOAccessKey, cfg.MinIOSecretKey, ""),
		Secure: cfg.MinIOUseSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("create minio client: %w", err)
	}
	return &Client{bucket: cfg.MinIOBucket, minio: client}, nil
}

func (c *Client) PutJSON(ctx context.Context, key string, body []byte) error {
	exists, err := c.minio.BucketExists(ctx, c.bucket)
	if err != nil {
		return fmt.Errorf("check bucket: %w", err)
	}
	if !exists {
		if err := c.minio.MakeBucket(ctx, c.bucket, minio.MakeBucketOptions{}); err != nil {
			return fmt.Errorf("create bucket: %w", err)
		}
	}
	_, err = c.minio.PutObject(ctx, c.bucket, key, bytes.NewReader(body), int64(len(body)), minio.PutObjectOptions{ContentType: "application/json"})
	if err != nil {
		return fmt.Errorf("put object: %w", err)
	}
	return nil
}
